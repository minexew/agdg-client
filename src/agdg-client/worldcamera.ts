module BABYLON {
    export class WorldCamera extends BABYLON.TargetCamera {
        public alpha: number;

        public beta: number;

        public radius: number;

        public target: Vector3;

        public inertialAlphaOffset = 0;

        public inertialBetaOffset = 0;

        public inertialRadiusOffset = 0;

        public lowerAlphaLimit = null;

        public upperAlphaLimit = null;

        public lowerBetaLimit = 0.01;

        public upperBetaLimit = Math.PI;

        public lowerRadiusLimit = null;

        public upperRadiusLimit = null;

        public inertialPanningX: number = 0;

        public inertialPanningY: number = 0;

        public zoomOnFactor = 1;

        public targetScreenOffset = Vector2.Zero();

        public allowUpsideDown = true;

        public _viewMatrix = new Matrix();
        public _useCtrlForPanning: boolean;

        public _reset: () => void;
        
        // Panning
        public panningAxis: Vector3 = new Vector3(1, 1, 0);
        private _localDirection: Vector3;
        private _transformedDirection: Vector3;

        // Collisions
        public onCollide: (collidedMesh: AbstractMesh) => void;
        public checkCollisions = false;
        public collisionRadius = new Vector3(0.5, 0.5, 0.5);
        private _collider = new Collider();
        private _previousPosition = Vector3.Zero();
        private _collisionVelocity = Vector3.Zero();
        private _newPosition = Vector3.Zero();
        private _previousAlpha: number;
        private _previousBeta: number;
        private _previousRadius: number;
        //due to async collision inspection
        private _collisionTriggered: boolean;

        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene) {
            super(name, Vector3.Zero(), scene);

            if (!target) {
                this.target = Vector3.Zero();
            } else {
                this.target = target;
            }

            this.alpha = alpha;
            this.beta = beta;
            this.radius = radius;

            this.getViewMatrix();
        }

        // Cache
        public _initCache(): void {
            super._initCache();
            this._cache.target = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.alpha = undefined;
            this._cache.beta = undefined;
            this._cache.radius = undefined;
            this._cache.targetScreenOffset = Vector2.Zero();
        }

        public _updateCache(ignoreParentClass?: boolean): void {
            if (!ignoreParentClass) {
                super._updateCache();
            }

            this._cache.target.copyFrom(this._getTargetPosition());
            this._cache.alpha = this.alpha;
            this._cache.beta = this.beta;
            this._cache.radius = this.radius;
            this._cache.targetScreenOffset.copyFrom(this.targetScreenOffset);
        }

        private _getTargetPosition(): Vector3 {
            if ((<any>this.target).getAbsolutePosition) {
                return (<any>this.target).getAbsolutePosition();
            }

            return this.target;
        }

        // Synchronized
        public _isSynchronizedViewMatrix(): boolean {
            if (!super._isSynchronizedViewMatrix())
                return false;

            return this._cache.target.equals(this.target)
                && this._cache.alpha === this.alpha
                && this._cache.beta === this.beta
                && this._cache.radius === this.radius
                && this._cache.targetScreenOffset.equals(this.targetScreenOffset);
        }

        private _checkLimits() {
            if (this.lowerBetaLimit === null || this.lowerBetaLimit === undefined) {
                if (this.allowUpsideDown && this.beta > Math.PI) {
                    this.beta = this.beta - (2 * Math.PI);
                }
            } else {
                if (this.beta < this.lowerBetaLimit) {
                    this.beta = this.lowerBetaLimit;
                }
            }

            if (this.upperBetaLimit === null || this.upperBetaLimit === undefined) {
                if (this.allowUpsideDown && this.beta < -Math.PI) {
                    this.beta = this.beta + (2 * Math.PI);
                }
            } else {
                if (this.beta > this.upperBetaLimit) {
                    this.beta = this.upperBetaLimit;
                }
            }

            if (this.lowerAlphaLimit && this.alpha < this.lowerAlphaLimit) {
                this.alpha = this.lowerAlphaLimit;
            }
            if (this.upperAlphaLimit && this.alpha > this.upperAlphaLimit) {
                this.alpha = this.upperAlphaLimit;
            }

            if (this.lowerRadiusLimit && this.radius < this.lowerRadiusLimit) {
                this.radius = this.lowerRadiusLimit;
            }
            if (this.upperRadiusLimit && this.radius > this.upperRadiusLimit) {
                this.radius = this.upperRadiusLimit;
            }
        }

        public rebuildAnglesAndRadius() {
            var radiusv3 = this.position.subtract(this._getTargetPosition());
            //this.radius = radiusv3.length();

            // Alpha
            this.alpha = Math.acos(radiusv3.x / Math.sqrt(Math.pow(radiusv3.x, 2) + Math.pow(radiusv3.z, 2)));

            if (radiusv3.z < 0) {
                this.alpha = 2 * Math.PI - this.alpha;
            }

            // Beta
            this.beta = Math.acos(radiusv3.y / this.radius);

            this._checkLimits();
        }

        public setPosition(position: Vector3): void {
            if (this.position.equals(position)) {
                return;
            }
            this.position = position;

            this.rebuildAnglesAndRadius();
        }

        public setTarget(target: Vector3): void {
            if (this._getTargetPosition().equals(target)) {
                return;
            }
            this.target = target;
            this.rebuildAnglesAndRadius();
        }

        public _getViewMatrix(): Matrix {
            // Compute
            /*var cosa = Math.cos(this.alpha);
            var sina = Math.sin(this.alpha);
            var cosb = Math.cos(this.beta);
            var sinb = Math.sin(this.beta);

            if (sinb === 0) {
                sinb = 0.0001;
            }
            */
            var target = this._getTargetPosition();
            /*target.addToRef(new Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb), this._newPosition);
            if (this.getScene().collisionsEnabled && this.checkCollisions) {
                this._collider.radius = this.collisionRadius;
                this._newPosition.subtractToRef(this.position, this._collisionVelocity);
                this._collisionTriggered = true;
                this.getScene().collisionCoordinator.getNewPosition(this.position, this._collisionVelocity, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
            } else {
                this.position.copyFrom(this._newPosition);

                var up = this.upVector;
                if (this.allowUpsideDown && this.beta < 0) {
                    up = up.clone();
                    up = up.negate();
                }

                Matrix.LookAtLHToRef(this.position, target, up, this._viewMatrix);
                this._viewMatrix.m[12] += this.targetScreenOffset.x;
                this._viewMatrix.m[13] += this.targetScreenOffset.y;
            }*/
            var camVec = new BABYLON.Vector3(1, 1, 1);
            camVec.scaleInPlace(this.radius / camVec.length());
            camVec.addInPlace(target);
            Matrix.LookAtLHToRef(camVec, target, new BABYLON.Vector3(-1, -1, 1).normalize(), this._viewMatrix);
            return this._viewMatrix;
        }

        private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: AbstractMesh = null) => {

            if (this.getScene().workerCollisions && this.checkCollisions) {
                newPosition.multiplyInPlace(this._collider.radius);
            }

            if (!collidedMesh) {
                this._previousPosition.copyFrom(this.position);
            } else {
                this.setPosition(newPosition);

                if (this.onCollide) {
                    this.onCollide(collidedMesh);
                }
            }

            // Recompute because of constraints
            var cosa = Math.cos(this.alpha);
            var sina = Math.sin(this.alpha);
            var cosb = Math.cos(this.beta);
            var sinb = Math.sin(this.beta);

            if (sinb === 0) {
                sinb = 0.0001;
            }

            var target = this._getTargetPosition();
            target.addToRef(new Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb), this._newPosition);
            this.position.copyFrom(this._newPosition);

            var up = this.upVector;
            if (this.allowUpsideDown && this.beta < 0) {
                up = up.clone();
                up = up.negate();
            }

            Matrix.LookAtLHToRef(this.position, target, up, this._viewMatrix);
            this._viewMatrix.m[12] += this.targetScreenOffset.x;
            this._viewMatrix.m[13] += this.targetScreenOffset.y;

            this._collisionTriggered = false;
        }

        public zoomOn(meshes?: AbstractMesh[], doNotUpdateMaxZ = false): void {
            meshes = meshes || this.getScene().meshes;

            var minMaxVector = Mesh.MinMax(meshes);
            var distance = Vector3.Distance(minMaxVector.min, minMaxVector.max);

            this.radius = distance * this.zoomOnFactor;

            this.focusOn({ min: minMaxVector.min, max: minMaxVector.max, distance: distance }, doNotUpdateMaxZ);
        }

        public focusOn(meshesOrMinMaxVectorAndDistance, doNotUpdateMaxZ = false): void {
            var meshesOrMinMaxVector;
            var distance;

            if (meshesOrMinMaxVectorAndDistance.min === undefined) { // meshes
                meshesOrMinMaxVector = meshesOrMinMaxVectorAndDistance || this.getScene().meshes;
                meshesOrMinMaxVector = Mesh.MinMax(meshesOrMinMaxVector);
                distance = Vector3.Distance(meshesOrMinMaxVector.min, meshesOrMinMaxVector.max);
            }
            else { //minMaxVector and distance
                meshesOrMinMaxVector = meshesOrMinMaxVectorAndDistance;
                distance = meshesOrMinMaxVectorAndDistance.distance;
            }

            this.target = Mesh.Center(meshesOrMinMaxVector);

            if (!doNotUpdateMaxZ) {
                this.maxZ = distance * 2;
            }
        }
        
        /**
         * @override
         * Override Camera.createRigCamera
         */
        public createRigCamera(name: string, cameraIndex: number): Camera {
            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                case Camera.RIG_MODE_VR:
                    var alphaShift = this._cameraRigParams.stereoHalfAngle * (cameraIndex === 0 ? 1 : -1);
                    var rigCam = new ArcRotateCamera(name, this.alpha + alphaShift, this.beta, this.radius, this.target, this.getScene());
                    rigCam._cameraRigParams = {};
                    return rigCam;
            }
            return null;
        }
        
        /**
         * @override
         * Override Camera._updateRigCameras
         */
        public _updateRigCameras() {
            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                case Camera.RIG_MODE_VR:
                    var camLeft = <ArcRotateCamera>this._rigCameras[0];
                    var camRight = <ArcRotateCamera>this._rigCameras[1];
                    camLeft.alpha = this.alpha - this._cameraRigParams.stereoHalfAngle;
                    camRight.alpha = this.alpha + this._cameraRigParams.stereoHalfAngle;
                    camLeft.beta = camRight.beta = this.beta;
                    camLeft.radius = camRight.radius = this.radius;
                    break;
            }
            super._updateRigCameras();
        }

        public dispose(): void {
            super.dispose();
        }

        public getTypeName(): string {
            return "ArcRotateCamera";
        }
    }
} 
