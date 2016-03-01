/// <reference path="gamescreen.ts"/>
/// <reference path="../playcanvas.ts"/>

module agdg {
    export class Entity extends pc.Entity {
        velocity: pc.Vec3 = new pc.Vec3();

        lerpSegments: Array<any>;
        lastPoint: any;

        labelDiv: JQuery;
        width: number;

        constructor() {
            super();
        }

        destroy() {
            if (this.labelDiv)
                this.labelDiv.remove();

            super.destroy();
        }

        interpolatePosition() {
            if (!this.lerpSegments.length)
                return;

            // travel one frame worth of distance
            var remainder = 1;

            while (remainder > 0.001) {
                // get current lerpSegment
                var seg = this.lerpSegments[0];

                var multiplier;

                // enough travel left in current lerpSegment?
                if (seg.duration > remainder) {
                    multiplier = remainder;
                    remainder = 0;
                }
                else {
                    // nope, use all that's left and grab more from the next lerpSegment - if any
                    multiplier = seg.duration;
                    remainder -= multiplier;
                }

                this.translate(seg.vec.clone().scale(multiplier));

                seg.duration -= multiplier;

                // end of current lerpSegment?
                if (seg.duration < 0.001) {
                    this.lerpSegments.splice(0, 1);

                    if (!this.lerpSegments.length)
                        return;
                }
            }
        }

        setName(name: string): void {
            super.setName(name);

            if (!this.labelDiv) {
                this.labelDiv = $('<div style="font-weight: bold; position: fixed; text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.75)"></div>');
                $('body').append(this.labelDiv);
            }

            this.labelDiv.text(name);
            this.width = this.labelDiv.width();
        }

        update() {
            if (this.lerpSegments)
                this.interpolatePosition();
            else
                this.translate(this.velocity);

            if (this.labelDiv) {
                var pos = g_camera.worldToScreen(this.getPosition());
                this.labelDiv.css('left', pos.x - this.width / 2).css('top', pos.y - 100);
            }
        }

        updateInterpPosDir(pos: pc.Vec3, dir: pc.Vec3) {
            // TODO: handle big jumps

            var speed = 0.05;

            if (!this.lerpSegments)
                this.lerpSegments = [];

            if (!this.lastPoint)
                this.lastPoint = this.getPosition();

            var towards = pos.clone();
            towards.sub(this.lastPoint);
            var dist = towards.length();

            if (dist < 0.001)
                return;

            var duration = dist / speed;
            towards.normalize().scale(speed);

            this.lerpSegments.push({ vec: towards, duration: duration });
            this.lastPoint = pos;
        }
    }
}
