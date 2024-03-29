/*
 ** Copyright 2020 Bloomberg Finance L.P.
 **
 ** Licensed under the Apache License, Version 2.0 (the "License");
 ** you may not use this file except in compliance with the License.
 ** You may obtain a copy of the License at
 **
 **     http://www.apache.org/licenses/LICENSE-2.0
 **
 ** Unless required by applicable law or agreed to in writing, software
 ** distributed under the License is distributed on an "AS IS" BASIS,
 ** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 ** See the License for the specific language governing permissions and
 ** limitations under the License.
 */

import { InternGraph, assertFeatures } from "./interngraph";
import {
    isObject,
    objectFromEntries,
    validateProperty,
    isRecord,
    markRecord,
    define,
} from "./utils";

function createFreshRecordFromProperties(properties) {
    const record = Object.create(Record.prototype);
    for (const [name, value] of properties) {
        record[name] = validateProperty(value);
    }
    Object.freeze(record);
    markRecord(record);
    return record;
}

const RECORD_GRAPH = new InternGraph(createFreshRecordFromProperties);

function createRecordFromObject(value) {
    assertFeatures();
    if (!isObject(value)) {
        throw new Error("invalid value, expected object argument");
    }

    // sort all property names by the order specified by
    // the argument's OwnPropertyKeys internal slot
    // EnumerableOwnPropertyNames - 7.3.22
    const properties = Object.entries(value)
        .sort(function(a, b) {
            if (a < b) return -1;
            else if (a > b) return 1;
            return 0;
        })
        .map(([name, value]) => [name, validateProperty(value)]);

    return RECORD_GRAPH.get(properties);
}

export function Record(value) {
    return createRecordFromObject(value);
}
// ensure that Record.name is "Record" even if this
// source is aggressively minified or bundled.
if (Record.name !== "Record") {
    Object.defineProperty(Record, "name", {
        value: "Record",
        configurable: true,
    });
}

define(Record, {
    isRecord,
    fromEntries(iterator) {
        return createRecordFromObject(objectFromEntries(iterator));
    },
});

Record.prototype = Object.create(null);
define(Record.prototype, {
    constructor: Record,
    toString() {
        return "[record Record]";
    },
});
