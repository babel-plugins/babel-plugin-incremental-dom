"use strict";

elementOpen("div");
elementOpen("div", null, ["class", "my-class"]);
elementClose("div");
elementOpen("div", null, null, "class", "my-class");
elementClose("div");
elementOpen("div", null, null, "class", myClass);
elementClose("div");
elementOpen("div", null, null, "class", props.myClass);
elementClose("div");
elementClose("div");
