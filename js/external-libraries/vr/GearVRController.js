
THREE.GearVRController = function ( id ) {

    THREE.Object3D.call( this );

    var scope = this;
    var gamepad;

    var axes = [ 0, 0 ];
    var thumbpadIsPressed = false;
    var triggerIsPressed = false;


    function findGamepad( id ) {

        // Iterate across gamepads

        var gamepads = navigator.getGamepads();

        for ( var i = 0, j = 0; i < 4; i ++ ) {

            var gamepad = gamepads[ i ];

            if ( gamepad && ( gamepad.id === 'Gear VR Controller' ) ) {

                if ( j === id ) return gamepad;

                j ++;

            }

        }

    }

    this.matrixAutoUpdate = false;
    this.standingMatrix = new THREE.Matrix4();

    this.getGamepad = function () {

        return gamepad;

    };

    this.getButtonState = function ( button ) {

        if ( button === 'thumbpad' ) return thumbpadIsPressed;
        if ( button === 'trigger' ) return triggerIsPressed;

    };

    this.update = function () {

        gamepad = findGamepad( id );

        if ( gamepad !== undefined && gamepad.pose !== undefined ) {

            if ( gamepad.pose === null ) return; // No user action yet

            //  Position and orientation.

            var pose = gamepad.pose;

            if ( pose.position !== null ) scope.position.fromArray( pose.position );
            if ( pose.orientation !== null ) scope.quaternion.fromArray( pose.orientation );
            scope.matrix.compose( scope.position, scope.quaternion, scope.scale );
            scope.matrix.multiplyMatrices( scope.standingMatrix, scope.matrix );
            scope.matrixWorldNeedsUpdate = true;
            scope.visible = true;

            //  Thumbpad and Buttons.

            if ( axes[ 0 ] !== gamepad.axes[ 0 ] || axes[ 1 ] !== gamepad.axes[ 1 ] ) {

                axes[ 0 ] = gamepad.axes[ 0 ]; //  X axis: -1 = Left, +1 = Right.
                axes[ 1 ] = gamepad.axes[ 1 ]; //  Y axis: -1 = Bottom, +1 = Top.
                scope.dispatchEvent( { type: 'axischanged', axes: axes } );

            }

            if ( thumbpadIsPressed !== gamepad.buttons[ 0 ].pressed ) {

                thumbpadIsPressed = gamepad.buttons[ 0 ].pressed;
                scope.dispatchEvent( { type: thumbpadIsPressed ? 'thumbpaddown' : 'thumbpadup' } );

            }

            if ( triggerIsPressed !== gamepad.buttons[ 1 ].pressed ) {

                triggerIsPressed = gamepad.buttons[ 1 ].pressed;
                scope.dispatchEvent( { type: triggerIsPressed ? 'triggerdown' : 'triggerup' } );

            }

        } else {

            scope.visible = false;

        }

    };

};

THREE.GearVRController.prototype = Object.create( THREE.Object3D.prototype );
THREE.GearVRController.prototype.constructor = THREE.GearVRController;
