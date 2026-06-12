// sockjs-client expects a Node-style "global" object in the browser
(window as never as { global: Window }).global = window;
