Ext.define('Ext.panel.TimeView', {
    extend: 'Ext.Panel',
    xtype: 'analogtime',
    requires: [
        'Ext.panel.TimeHeader'
    ],

    config: {
        value: 'now',
        autoAdvance: true,
        vertical: true,
        confirmable: false,
        confirmHandler: null,
        declineHandler: null,
        scope: 'this',
        buttonAlign: 'right',
        defaultButtons: {
            ok: {
                handler: 'up.onConfirm'
            },
            cancel: {
                handler: 'up.onDecline'
            }
        },

        /**
         * @cfg {String} mode
         * @private
         * Default mode for Time Panel. values can be 'hour' or 'minute'
         */
        mode: 'hour'
    },

    platformConfig: {
        'phone || tablet': {
            vertical: 'auto'
        }
    },

    classCls: Ext.baseCSSPrefix + 'analogtime',
    dotIndicatorCls: Ext.baseCSSPrefix + 'analog-picker-dot-indicator',

    /**
     * @property animationTimeDelay
     * delay time so the time changes color after the hand rotation animation
     */
    animationTimeDelay: 200,

    initDate: '1/1/1970',

    header: {
        xtype: 'analogtimeheader'
    },

    listeners: {
        painted: 'onPainted',
        scope: 'this'
    },

    /**
     * Largest number in minutes that the time picker can represent (12:59PM)
     * @private
     */
    MAX_MINUTES: (24 * 60) + 59,

    getTemplate: function () {
        var template = this.callParent(),
            child = template[0].children[0];

        child.children = [{
            reference: 'pickerWrapEl',
            cls: Ext.baseCSSPrefix + 'picker-wrap-el',
            children: [{
                cls: Ext.baseCSSPrefix + 'analog-picker-el',
                reference: 'analogPickerEl',
                children: [{
                    cls: Ext.baseCSSPrefix + 'analog-picker-hand-el',
                    reference: 'handEl'
                }, {
                    cls: Ext.baseCSSPrefix + 'analog-picker-face-el',
                    reference: 'faceEl'
                }],
                listeners: {
                    mousedown: 'onFaceMouseDown',
                    mouseup: 'onFaceMouseUp'
                }
            }]
        }];

        return template;
    },

    activateHours: function (value, options) {
        var me = this,
            header = me.getHeader(),
            am = this.getAm(),
            hoursEl = header.hoursEl,
            minutesEl = header.minutesEl,
            hours = me.getHours();

        me.setMode('hour');
        value = value != null ? value : (hours >= 12 ? hours - 12 : hours) + (!am ? 12 : 0);
        hoursEl.addCls('active');
        minutesEl.removeCls('active');
        me.setHours(value, options);
    },

    activateMinutes: function (value, options) {
        var me = this,
            header = me.getHeader(),
            hoursEl = header.hoursEl,
            minutesEl = header.minutesEl;

        me.setMode('minute');
        value = value != null ? value : me.getMinutes();
        minutesEl.addCls('active');
        hoursEl.removeCls('active');
        me.setMinutes(value, options);
    },

    applyValue: function (value) {
        var now;

        if (Ext.isDate(value)) {
            value = (value.getHours() * 60) + value.getMinutes();
        }
        else if (value === 'now' || !Ext.isNumber(value) || isNaN(value) ||
            value < 0 || value > (this.MAX_MINUTES)) {
            now = new Date();
            value = (now.getHours() * 60) + now.getMinutes();
        }

        return value;
    },

    getAngleFromTime: function (time, type) {
        var isMinute = type !== 'hour',
            total = isMinute ? 60 : 12,
            anglePerItem = 360 / total,
            initialRotation = isMinute ? (anglePerItem * 15) : (anglePerItem * 3);

        return (time * (anglePerItem)) - initialRotation;
    },

    getCenter: function () {
        var me = this,
            center, size;

        if (!me._center) {
            me._center = center = me.analogPickerEl.getXY();
            size = me.analogPickerEl.measure();
            center[0] += Math.floor(size.width / 2);
            center[1] += Math.floor(size.height / 2);
        }

        return me._center;
    },

    getTimeFromAngle: function (angle) {
        var me = this,
            mode = me.getMode(),
            isMinute = mode !== 'hour',
            total = isMinute ? 60 : 12,
            anglePerItem = 360 / total,
            initialRotation = isMinute ? (anglePerItem * 15) : (anglePerItem * 3);

        angle = anglePerItem * Math.round(angle / anglePerItem);
        angle += initialRotation;

        if (angle >= 360) {
            angle -= 360;
        }

        if (!isMinute && angle === 0) {
            return total;
        }
        else {
            return angle / anglePerItem;
        }
    },

    getElementByValue: function (value) {
        var me = this,
            mode = this.getMode();

        value = parseInt(value);

        if (mode === 'hour' && value === 0) {
            value = 12;
        }

        if (!me.itemValueMap) {
            me.layoutFace();
        }

        return me.itemValueMap[value];
    },

    getHours: function () {
        var value = this.getValue();

        return Math.floor(value / 60);
    },

    getMinutes: function () {
        var me = this,
            value = me.getValue(),
            hour = me.getHours();

        return value != null ? value - (hour * 60) : 0;
    },

    getAm: function () {
        var value = this.getValue(),
            hour = Math.floor(value / 60);

        return hour < 12;
    },

    layoutFace: function () {
        if (!this.rendered) {
            return;
        }

        var me = this,
            parent = me.getParent(),
            mode = me.getMode(),
            face = me.faceEl,
            pickerWidth = face.measure('w'),
            isMinute = mode === 'minute',
            type = isMinute ? 'minute' : 'hour',
            padding = 50,
            total = isMinute ? 60 : 12,
            i, item, itemText, rot;

        face.setHtml('');
        me.itemValueMap = {};

        for (i = 1; i <= total; i++) {
            item = Ext.Element.create();
            rot = me.getAngleFromTime(i, type);
            itemText = i;

            if (isMinute) {
                itemText = i;
                if (i % 5 !== 0) {
                    item.setStyle('opacity', 0);
                }

                if (i === 60) {
                    itemText = '0';
                }
                item.addCls('minute-picker-el');
            }
            else {
                item.addCls('hour-picker-el');
            }

            item.type = type;
            item.value = parseInt(itemText);
            item.rotation = rot;
            item.setText(isMinute ? Ext.String.leftPad(itemText, 2, '0') : itemText);
            me.itemValueMap[item.value] = item;

            item.setStyle('transform', 'rotate(' + rot + 'deg) translateX(' + ((pickerWidth - padding) / 2) + 'px) rotate(' + (-rot) + 'deg)');

            face.appendChild(item);
        }

        // Heighted parents should be resized here in case of orientation changes
        if (parent && parent.isHeighted()) {
            parent.updateHeight();
        }
    },

    onConfirm: function (e) {
        var me = this;

        me.updateField();

        Ext.callback(me.getConfirmHandler(), me.getScope(), [me, e], 0, me);
    },

    onDecline: function (e) {
        var me = this;

        me.collapsePanel();

        Ext.callback(me.getDeclineHandler(), me.getScope(), [me, e], 0, me);
    },

    onFaceElementClick: function (target, options) {
        target = Ext.fly(target);

        if (!target) {
            return;
        }

        var me = this,
            am = me.getAm(),
            value = target.value,
            type = target.type;

        if (type) {
            if (type === 'hour') {
                value = am ? value : value + 12;
                value = (am && value === 12) ? 0 : value;
                me.setHours(value, options);
            }
            else {
                me.setMinutes(value, options);

                if (!me.getConfirmable()) {
                    me.updateField();
                }
            }
        }

        if (me.getAutoAdvance() && me.getMode() === 'hour') {
            me.activateMinutes(null, {
                delayed: true,
                animate: true
            });
        }
    },

    onFaceMouseDown: function (e) {
        var me = this;

        if (!me.dragging) {
            // Prevent default here to prevent iOS < 11
            // from scrolling the window around whole we drag
            e.preventDefault();
            me.startDrag();
        }
    },

    onFaceMouseUp: function (e) {
        var me = this,
            target;

        // In case of Touch devices to get correct target on mouseup 
        // we need to use document.elementFromPoint method with event co-ordinates
        if (e.pointerType === 'touch') {
            target = document.elementFromPoint.apply(document, e.getXY());
        }
        else {
            target = e.target;
        }

        me.stopDrag();
        me.onFaceElementClick(target);
    },

    onHoursClick: function () {
        this.activateHours(null, {
            animate: true
        });
    },

    onMouseMove: function (e) {
        var me = this,
            options = {
                disableAnimation: true
            },
            mode = me.getMode(),
            am = me.getAm(),
            angle, center, point, x, y, value;

        if (me.dragging) {
            center = me.getCenter();
            point = e.getXY();
            x = point[0] - center[0];
            y = point[1] - center[1];
            angle = Math.atan2(y, x);
            angle = angle * (180 / Math.PI);

            if (y < 0) {
                angle += 360;
            }

            value = me.getTimeFromAngle(angle);

            if (mode === 'hour') {
                value = am ? value : value + 12;
                value = (am && value === 12) ? 0 : value;
                me.setHours(value, options);
            } else {
                me.setMinutes(value, options);
            }
        }
    },

    onAmClick: function () {
        this.setAm(true);
    },

    onMinutesClick: function () {
        this.activateMinutes(null, {
            animate: true
        });
    },

    onOrientationChange: function () {
        this.setVerticalByOrientation();
    },

    onPainted: function () {
        var me = this;

        me.layoutFace();
        me.updateValue(me.getValue());
        me.activateHours();
    },

    onPmClick: function () {
        this.setAm(false);
    },

    setAm: function (value) {
        var me = this,
            current = me.getAm(),
            hours = me.getHours(),
            header = me.getHeader(),
            amEl = header.amEl,
            pmEl = header.pmEl,
            el = value ? amEl : pmEl;

        if (!me.hasSetAm || current !== value) {
            amEl.removeCls('active');
            pmEl.removeCls('active');
            el.addCls('active');
            me.hasSetAm = true;
        }

        if (current !== value) {
            me.setHours(hours + (value ? -12 : 12));
        }
    },

    setClockHand: function (options) {
        var me = this,
            isMinute = options.type === 'minute',
            currentMode = me.getMode(),
            mode = isMinute ? 'minute' : 'hour',
            value = !isMinute && options.value > 12 ? options.value - 12 : options.value,
            rotation = me.getAngleFromTime(value, options.type),
            analogPickerEl = me.analogPickerEl,
            handEl = me.handEl,
            el;

        analogPickerEl.removeCls(['animated', 'animated-delayed']);
        analogPickerEl.toggleCls(me.dotIndicatorCls, isMinute && value % 5 !== 0);

        if (currentMode !== mode) {
            this.setMode(isMinute ? 'minute' : 'hour');
        }

        el = me.getElementByValue(value);

        if (el && (!me.activeElement || me.activeElement !== el)) {
            if (me.activeElement) {
                me.activeElement.removeCls('active');
            }

            me.activeElement = el;

            if (options.disableAnimation) {
                el.addCls('active');
            } else {
                // We delay here so the time changes color
                // after the hand rotation animation
                Ext.defer(function () {
                    el.addCls('active');
                }, me.animationTimeDelay);
            }
        }

        if (handEl.rotation !== rotation) {
            analogPickerEl.toggleCls('animated' + (options.delayed ? '-delayed' : ''), !!options.animate);
            handEl.setStyle('transform', 'rotate(' + rotation + 'deg)');
            handEl.rotation = rotation;
        }
    },

    setHours: function (value, options) {
        var me = this,
            header = me.getHeader(),
            mode = me.getMode(),
            minutes = me.getMinutes(),
            displayValue = value > 12 ? value - 12 : value;

        displayValue = displayValue === 0 ? 12 : displayValue;
        header.hoursEl.setText(displayValue);

        if (mode === 'hour') {
            me.setClockHand(Ext.apply({
                value: value,
                type: 'hour'
            }, options));
        }

        me.setValue((value * 60) + minutes);
    },

    setMinutes: function (value, options) {
        var me = this,
            header = me.getHeader(),
            mode = me.getMode(),
            hours = me.getHours();

        header.minutesEl.setText(Ext.String.leftPad(value, 2, '0'));

        if (mode === 'minute') {
            me.setClockHand(Ext.apply({
                value: value,
                type: 'minute'
            }, options));
        }

        me.setValue((hours * 60) + value);
    },

    setTime: function (hour, minute, am) {
        var me = this;

        me.setHours(hour);
        me.setMinutes(minute);
        me.setAm(am);
    },

    startDrag: function () {
        var me = this;

        me.el.on({
            mousemove: 'onMouseMove',
            scope: me
        });

        me.dragging = true;
    },

    stopDrag: function () {
        var me = this;

        me.el.un({
            mousemove: 'onMouseMove',
            scope: me
        });

        me._center = null;
        me.dragging = false;
    },

    updateConfirmable: function (confirmable) {
        this.setButtons(confirmable && this.getDefaultButtons());
    },

    updateMode: function () {
        this.layoutFace();
    },

    updateValue: function () {
        var me = this,
            hour = me.getHours(),
            minutes = me.getMinutes(),
            am = me.getAm();

        if (this.rendered) {
            me.setHours(hour);
            me.setMinutes(minutes);
            me.hasSetAm = false;
            me.setAm(am);
        }
    },

    updateField: function () {
        var me = this,
            hour = me.getHours(),
            minutes = me.getMinutes(),
            newValue = new Date(me.initDate);

        newValue.setHours(hour > 23 ? hour - 12 : hour);
        newValue.setMinutes(minutes);

        me.fireEvent('select', me.parent, newValue);
    },

    collapsePanel: function () {
        this.fireEvent('collapsePanel', this);
    },

    setVerticalByOrientation: function () {
        this.updateVertical('auto');
    },

    updateVertical: function (vertical) {
        var me = this,
            viewport = Ext.Viewport;

        if (viewport) {
            if (vertical === 'auto') {
                vertical = viewport.getOrientation() === viewport.PORTRAIT;

                viewport.on('orientationchange', 'onOrientationChange', me);
            } else {
                viewport.un('orientationchange', 'onOrientationChange', me);
            }
        }

        me.toggleCls(Ext.baseCSSPrefix + 'vertical', vertical);
        me.setHeaderPosition(vertical ? 'top' : 'left');

        me.layoutFace();
    },

    doDestroy: function () {
        var viewport = Ext.Viewport;

        if (viewport) {
            viewport.un('orientationchange', 'onOrientationChange', this);
        }

        this.callParent();
    }
});
