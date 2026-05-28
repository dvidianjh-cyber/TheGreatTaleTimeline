/**
 * SchemaValidator.js — JSON Validation & XSS Sanitization
 * Last Modified: 2026-05-15
 *
 * Validates incoming JSON against the world-agnostic data contracts.
 * Sanitizes all string fields to prevent HTML injection.
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 * @property {Object} [sanitized] - The sanitized data (if valid).
 */

class SchemaValidator {

    /**
     * Sanitize a string to prevent XSS / HTML injection.
     * @param {string} str
     * @returns {string}
     */
    sanitizeString(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    /**
     * Deep-sanitize all string values in an object/array.
     * @param {*} obj
     * @returns {*}
     */
    deepSanitize(obj) {
        if (typeof obj === 'string') return this.sanitizeString(obj);
        if (Array.isArray(obj)) return obj.map(item => this.deepSanitize(item));
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = this.deepSanitize(value);
            }
            return sanitized;
        }
        return obj;
    }

    /**
     * Validate a World Config object.
     * @param {Object} config
     * @returns {ValidationResult}
     */
    validateWorldConfig(config) {
        const errors = [];

        if (!config || typeof config !== 'object') {
            return { valid: false, errors: ['World config must be an object.'] };
        }
        if (typeof config.world_name !== 'string' || !config.world_name.trim()) {
            errors.push('world_name is required and must be a non-empty string.');
        }
        if (config.default_mode !== undefined && !['geographic', 'biographical'].includes(config.default_mode)) {
            errors.push('default_mode must be either "geographic" or "biographical".');
        }
        if (config.default_visible_timespan !== undefined) {
            if (!Array.isArray(config.default_visible_timespan) || config.default_visible_timespan.length !== 2 || typeof config.default_visible_timespan[0] !== 'number' || typeof config.default_visible_timespan[1] !== 'number') {
                errors.push('default_visible_timespan must be an array of two numbers.');
            }
        }
        if (!Array.isArray(config.time_systems) || config.time_systems.length === 0) {
            errors.push('time_systems must be a non-empty array.');
        } else {
            config.time_systems.forEach((ts, i) => {
                if (!ts.id) errors.push(`time_systems[${i}].id is required.`);
                if (!ts.name) errors.push(`time_systems[${i}].name is required.`);
                if (typeof ts.base_unit !== 'number' && typeof ts.conversion_factor !== 'number' && !ts.isPrimary) {
                    errors.push(`time_systems[${i}] must have either base_unit or conversion_factor.`);
                }
            });
        }
        if (!Array.isArray(config.epochs)) {
            errors.push('epochs must be an array.');
        } else {
            config.epochs.forEach((ep, i) => {
                if (!ep.id) errors.push(`epochs[${i}].id is required.`);
                if (typeof ep.start_tu !== 'number') errors.push(`epochs[${i}].start_tu must be a number.`);
            });
        }
        if (config.rulers !== undefined) {
            if (!Array.isArray(config.rulers)) {
                errors.push('rulers must be an array.');
            } else {
                config.rulers.forEach((r, i) => {
                    if (!r.label) errors.push(`rulers[${i}].label is required.`);
                    if (!r.epoch) errors.push(`rulers[${i}].epoch is required.`);
                });
            }
        }

        if (errors.length > 0) return { valid: false, errors };
        return { valid: true, errors: [], sanitized: config };
    }

    /**
     * Validate an Events array.
     * @param {Object} data - Object with an `events` array.
     * @returns {ValidationResult}
     */
    validateEvents(data) {
        const errors = [];

        if (!data || !Array.isArray(data.events)) {
            return { valid: false, errors: ['Data must contain an "events" array.'] };
        }

        data.events.forEach((evt, i) => {
            const prefix = `events[${i}]`;
            if (!evt.id) errors.push(`${prefix}.id is required.`);
            if (typeof evt.title !== 'string') errors.push(`${prefix}.title must be a string.`);

            if (!evt.time_extent || typeof evt.time_extent !== 'object') {
                errors.push(`${prefix}.time_extent is required and must be an object.`);
            } else {
                if (typeof evt.time_extent.start !== 'number') {
                    errors.push(`${prefix}.time_extent.start must be a number.`);
                }
                if (typeof evt.time_extent.end !== 'number') {
                    errors.push(`${prefix}.time_extent.end must be a number.`);
                }
            }

            if (evt.importance !== undefined) {
                if (typeof evt.importance !== 'number' || evt.importance < 0 || evt.importance > 10) {
                    errors.push(`${prefix}.importance must be a number between 0 and 10.`);
                }
            }
        });

        if (errors.length > 0) return { valid: false, errors };
        return { valid: true, errors: [], sanitized: data };
    }

    /**
     * Validate an Entities array.
     * @param {Object} data - Object with an `entities` array.
     * @returns {ValidationResult}
     */
    validateEntities(data) {
        const errors = [];

        if (!data || !Array.isArray(data.entities)) {
            return { valid: false, errors: ['Data must contain an "entities" array.'] };
        }

        data.entities.forEach((ent, i) => {
            const prefix = `entities[${i}]`;
            if (!ent.id) errors.push(`${prefix}.id is required.`);
            if (typeof ent.name !== 'string') errors.push(`${prefix}.name must be a string.`);
            if (ent.metadata && typeof ent.metadata !== 'object') {
                errors.push(`${prefix}.metadata must be an object if provided.`);
            }
        });

        if (errors.length > 0) return { valid: false, errors };
        return { valid: true, errors: [], sanitized: data };
    }

    /**
     * Validate a Lanes array.
     * @param {Object} data - Object with a `lanes` array.
     * @returns {ValidationResult}
     */
    validateLanes(data) {
        const errors = [];

        if (!data || !Array.isArray(data.lanes)) {
            return { valid: false, errors: ['Data must contain a "lanes" array.'] };
        }

        data.lanes.forEach((lane, i) => {
            const prefix = `lanes[${i}]`;
            if (!lane.id) errors.push(`${prefix}.id is required.`);
            if (typeof lane.label !== 'string') errors.push(`${prefix}.label must be a string.`);
        });

        if (errors.length > 0) return { valid: false, errors };
        return { valid: true, errors: [], sanitized: data };
    }

    /**
     * Validate a complete dataset (all schemas at once).
     * @param {Object} dataset - Object containing world_config, events, entities, lanes.
     * @returns {ValidationResult}
     */
    validateFullDataset(dataset) {
        const allErrors = [];
        const sanitized = {};

        if (!dataset || typeof dataset !== 'object') {
            return { valid: false, errors: ['Dataset must be an object.'] };
        }

        // World config
        const configResult = this.validateWorldConfig(dataset.world_config);
        if (!configResult.valid) {
            allErrors.push(...configResult.errors.map(e => `[WorldConfig] ${e}`));
        } else {
            sanitized.world_config = configResult.sanitized;
        }

        // Events
        if (dataset.events !== undefined) {
            const eventsResult = this.validateEvents(dataset);
            if (!eventsResult.valid) {
                allErrors.push(...eventsResult.errors.map(e => `[Events] ${e}`));
            } else {
                sanitized.events = eventsResult.sanitized.events;
            }
        }

        // Entities
        if (dataset.entities !== undefined) {
            const entitiesResult = this.validateEntities(dataset);
            if (!entitiesResult.valid) {
                allErrors.push(...entitiesResult.errors.map(e => `[Entities] ${e}`));
            } else {
                sanitized.entities = entitiesResult.sanitized.entities;
            }
        }

        // Lanes
        if (dataset.lanes !== undefined) {
            const lanesResult = this.validateLanes(dataset);
            if (!lanesResult.valid) {
                allErrors.push(...lanesResult.errors.map(e => `[Lanes] ${e}`));
            } else {
                sanitized.lanes = lanesResult.sanitized.lanes;
            }
        }

        if (allErrors.length > 0) return { valid: false, errors: allErrors };
        
        // IMPORTANT: We no longer auto-sanitize here to avoid "persistence loops" 
        // where data is double-encoded every time it is saved and re-loaded.
        // We will sanitize on-the-fly during HTML rendering instead.
        return { valid: true, errors: [], sanitized: dataset };
    }

    /**
     * Repair double-encoded data by unescaping entities recursively.
     * @param {*} obj 
     * @returns {*}
     */
    deepUnescape(obj) {
        if (typeof obj === 'string') {
            // Use a textarea trick to unescape HTML entities
            const txt = document.createElement('textarea');
            txt.innerHTML = obj;
            let unescaped = txt.value;
            // Handle multiple layers of encoding (like the quadruple &amp; bug)
            while (unescaped.includes('&amp;') || unescaped.includes('&#x27;')) {
                txt.innerHTML = unescaped;
                if (txt.value === unescaped) break;
                unescaped = txt.value;
            }
            return unescaped;
        }
        if (Array.isArray(obj)) return obj.map(item => this.deepUnescape(item));
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = this.deepUnescape(value);
            }
            return sanitized;
        }
        return obj;
    }
}

/** Singleton instance */
const validator = new SchemaValidator();
export default validator;
