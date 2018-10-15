/*
 * This file launches the application by asking Ext JS to create
 * and launch() the Application class.
 */
Ext.application({
    extend: 'application.Application',

    name: 'application',

    requires: [
        // This will automatically load all classes in the application namespace
        // so that application classes do not need to require each other.
        'application.*'
    ],

    // The name of the initial view to create.
    mainView: 'application.view.main.Main'
});
