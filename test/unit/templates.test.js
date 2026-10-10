'use strict';
/**
 * The workflow templates in templates/ are importable n8n workflows: valid JSON, connections
 * between existing nodes, and every inwendo ERP node uses parameters the node defines.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dist = path.resolve(__dirname, '../../dist/nodes/InwendoErp');
const { InwendoErp } = require(path.join(dist, 'InwendoErp.node.js'));
const { InwendoErpTrigger } = require(path.join(dist, 'InwendoErpTrigger.node.js'));

const dir = path.resolve(__dirname, '../../templates');
const NODE_TYPES = {
	'n8n-nodes-inwendo-erp.inwendoErp': new InwendoErp().description,
	'n8n-nodes-inwendo-erp.inwendoErpTrigger': new InwendoErpTrigger().description,
};

/** Whether a property is shown for the given parameter values. */
function visible(property, params) {
	const show = property.displayOptions?.show ?? {};
	const hide = property.displayOptions?.hide ?? {};
	for (const [key, values] of Object.entries(show)) {
		if (!values.includes(params[key] ?? property.default)) return false;
	}
	for (const [key, values] of Object.entries(hide)) {
		if (values.includes(params[key])) return false;
	}
	return true;
}

describe('workflow templates', () => {
	const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

	it('there are templates', () => {
		assert.ok(files.length >= 6);
	});

	for (const file of files) {
		it(file, () => {
			const workflow = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
			assert.ok(workflow.name, 'name');
			const names = new Set(workflow.nodes.map((n) => n.name));
			assert.equal(names.size, workflow.nodes.length, 'node names are unique');
			for (const [from, outputs] of Object.entries(workflow.connections)) {
				assert.ok(names.has(from), `connection from unknown node ${from}`);
				for (const target of outputs.main.flat()) assert.ok(names.has(target.node), `connection to unknown node ${target.node}`);
			}
			for (const node of workflow.nodes) {
				const description = NODE_TYPES[node.type];
				if (!description) continue;
				const params = node.parameters;
				for (const [name, value] of Object.entries(params)) {
					const candidates = description.properties.filter((p) => p.name === name && visible(p, params));
					assert.ok(candidates.length > 0, `${node.name}: parameter "${name}" is not defined for these settings`);
					const property = candidates[0];
					if (property.type === 'options' && typeof value === 'string' && !value.startsWith('=')) {
						assert.ok(property.options.some((o) => o.value === value), `${node.name}: ${name}=${value}`);
					}
					if (property.type === 'collection' && value && typeof value === 'object') {
						for (const key of Object.keys(value)) {
							assert.ok(property.options.some((o) => o.name === key), `${node.name}: ${name}.${key}`);
						}
					}
				}
			}
		});
	}
});
