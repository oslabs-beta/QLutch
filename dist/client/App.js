import React from "react";
import { createRoot } from "react-dom/client";
const App = () => {
    return (React.createElement("div", null,
        React.createElement("h1", null, "Qlutch")));
};
createRoot(document.querySelector("#root")).render(React.createElement(App, null));
