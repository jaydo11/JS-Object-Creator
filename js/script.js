var app = angular.module("app", ["ui.sortable", "ngMessages"]);

// http:stackoverflow.com/a/33590754/3894163
app.run(function ($rootScope) {
    $rootScope.deepWatchGroup = function (watchExpressions, listener) {
        this.$watch('[' + watchExpressions + ']', listener, true);
    };
});

app.controller("controller", function ($scope, $interval) {
    $scope.variablePrefixes = [
        {value: "", delimiter: ""},
        {value: "var", delimiter: " "},
        {value: "vm", delimiter: "."},
        {value: "$scope", delimiter: "."},
        {value: "scope", delimiter: "."}
    ];

    $scope.object = {
        name: "",
        type: $scope.variablePrefixes[3]
    };

    $scope.properties = [new PropertyObject("string")];

    $scope.result = "";
    $scope.resultSpacing = "2";

    $scope.addNewProperty = function () {
        $scope.properties.push(new PropertyObject("string"));
    };

    $scope.addNewSubProperty = function (property) {
        property.properties.push(new PropertyObject(property.arrayType));
    };

    $scope.resetSubProperties = function (property) {
        if (property.type === "object") {
            property.value = {};
            property.properties.push(new PropertyObject("string"));
        } else if (property.type === "array") {
            property.properties = [];
        } else {
            property.properties = [];
        }
    };

    $scope.copyProperty = function (property, parent) {
        parent = (parent === undefined ? $scope : parent);
        parent.properties.push(cloneObject(property));
    };

    $scope.removeProperty = function (properties, index) {
        properties.splice(index, 1);
    };

    $scope.removeSubProperty = function (property, index) {
        property.properties.splice(index, 1);
    };

    var constructedObject = {};

    $scope.deepWatchGroup(["object", "properties", "resultSpacing"], function (newValue) {
        var spacing = $scope.resultSpacing === "tab" ? "\t" : Number($scope.resultSpacing);

        doPropertyStuff($scope.properties, constructedObject);
        // update the result
        $scope.result = ($scope.object.type.value + $scope.object.type.delimiter + ($scope.object.name === "" ? "variable" : $scope.object.name) + " = " + JSON.stringify(constructedObject, null, spacing)).trim() + ";";
    }, true);

    function doPropertyStuff(properties, reference) {
        // remove all properties from reference
        for (var prop in reference) {
            delete reference[prop];
        }

        // for each property, add it to the reference object
        for (var i = 0, il = properties.length; i < il; i++) {
            var property = properties[i];

            if (property.type === "array") {
                reference[property.name] = [];
                for (var j = 0; j < property.properties.length; j++) {
                    var subProperty = property.properties[j];

                    if (subProperty.type === "object") {
                        var newObject = {};
                        reference[property.name].push(newObject);
                        doPropertyStuff(subProperty.properties, newObject);
                    } else {
                        reference[property.name].push((subProperty.type === "number" ? Number(subProperty.value) : subProperty.value));
                    }
                }
            } else {
                var newVal = property.value;
                if (property.type === "number") {
                    newVal = Number(property.value);
                } else if (property.type === "boolean") {
                    newVal = (property.value === "true" ? true : false);
                }
                reference[property.name] = newVal;
                if (property.properties.length > 0) {
                    doPropertyStuff(property.properties, reference[property.name]);
                }
            }
        }
    }

    $scope.copyStatus = {
        success: false,
        error: false
    };

    document.getElementById("copyButton").addEventListener("click", function (event) {
        var hidden = document.getElementById("hidden");
        hidden.value = $scope.result;

        hidden.focus();
        hidden.select();

        try {
            if (document.execCommand('copy')) {
                $scope.copyStatus.success = true;
            } else {
                $scope.copyStatus.error = true;
            }
        } catch (err) {
            $scope.copyStatus.error = true;
        } finally {
            $interval(function () {
                $scope.copyStatus = {
                    success: false,
                    error: false
                };
            }, 2500);
        }
    });

});

function PropertyObject(type) {
    this.name = "";
    this.type = type;
    this.value = "";
    this.properties = [];
    this.arrayType = "string";
}

function cloneObject(source) {
    if (Object.prototype.toString.call(source) === '[object Array]') {
        var clone = [];
        for (var i = 0; i < source.length; i++) {
            clone[i] = cloneObject(source[i]);
        }
        return clone;
    } else if (typeof (source) === "object") {
        var clone = {};
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {

                if (prop === "value" && source.hasOwnProperty("type") && source.type === "date") {
                    clone[prop] = new Date(source.value);
                } else {
                    clone[prop] = cloneObject(source[prop]);
                }

            }
        }
        return clone;
    } else {
        return source;
    }
}