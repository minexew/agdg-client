﻿/// <reference path="gamescreen.ts"/>
/// <reference path="../babylon.d.ts"/>

module agdg {
    export class Entity {
        velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        name: string;
        node: any;

        lerpSegments: Array<any>;
        lastPoint: any;

        labelDiv: JQuery;
        labelWidth: number;

        chatBubble: JQuery;
        chatBubbleWidth: number;
        chatBubbleHeight: number;
        chatBubbleTimer: number;

        constructor(node: BABYLON.Node) {
            this.node = node;
        }

        destroy() {
            this.node.dispose();

            if (this.labelDiv)
                this.labelDiv.remove();

            if (this.chatBubble)
                this.chatBubble.remove();
        }

        getName(): string { return this.name; }

        getPosition(): BABYLON.Vector3 {
            return this.node.position;
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

                this.node.position.addInPlace(seg.vec.scale(multiplier));

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
            this.name = name;

            if (!this.labelDiv) {
                this.labelDiv = $('<div style="font-weight: bold; position: fixed; text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.75)"></div>');
                $('body').append(this.labelDiv);
            }

            this.labelDiv.text(name);
            this.labelWidth = this.labelDiv.width();
        }

        setPosition(pos: BABYLON.Vector3) {
            if (this.node)
                this.node.position = pos;
        }

        showChatBubble(messageHtml:JQuery) {
            if (this.chatBubble)
                this.chatBubble.remove();

            this.chatBubble = $('<div class="chatbubble">');
            this.chatBubble.append(messageHtml.clone());
            $('body').append(this.chatBubble);

            this.chatBubbleWidth = this.chatBubble.width();
            this.chatBubbleHeight = this.chatBubble.height();
            this.chatBubbleTimer = 100;
        }

        update() {
            if (this.lerpSegments)
                this.interpolatePosition();
            else if (this.node)
                this.node.position.addInPlace(this.velocity);
        }

        update2D() {
            if (this.labelDiv) {
				var pos = BABYLON.Vector3.Project(this.getPosition(), BABYLON.Matrix.Identity(), g_scene.getTransformMatrix(),
						g_camera.viewport.toGlobal(g_engine.getRenderWidth(), g_engine.getRenderHeight()));
                this.labelDiv.css('left', pos.x - this.labelWidth / 2).css('top', pos.y - 100);
            }

            if (this.chatBubble) {
                --this.chatBubbleTimer;

                if (this.chatBubbleTimer == 0)
                    this.chatBubble.fadeOut(1000);
                else if (this.chatBubbleTimer <= -100)
                    this.chatBubble.remove();
                else
                    this.chatBubble.css('left', pos.x - this.chatBubbleWidth / 2).css('top', pos.y - 100 - this.chatBubbleHeight);
            }
        }

        updateInterpPosDir(pos: BABYLON.Vector3, dir: BABYLON.Vector3) {
            // TODO: handle big jumps

            var speed = 0.05;

            if (!this.lerpSegments)
                this.lerpSegments = [];

            if (!this.lastPoint)
                this.lastPoint = this.getPosition();

            var towards = pos.subtract(this.lastPoint);
            var dist = towards.length();

            if (dist < 0.001)
                return;

            var duration = dist / speed;
            towards.normalize().scaleInPlace(speed);

            this.lerpSegments.push({ vec: towards, duration: duration });
            this.lastPoint = pos;
        }
    }
}
