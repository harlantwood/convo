import { z } from 'zod'
import type { ZodObject, ZodRawShape, ZodTypeAny } from 'zod'

type Field = {
	name: string
	type: string
	description: string
	choices: string[]
	required: boolean
}

type ToHtmlOptions = {
	ignoreSingleKeyNames: string[]
	priorityKeys?: string[]
}

export function zodSchema(fields: Field[]): ZodObject<ZodRawShape> {
	const schemaObject: Record<string, ZodTypeAny> = {}

	checkUniquePropertyNames(fields)

	for (const field of fields) {
		let zodField
		switch (field.type) {
			case 'string':
				zodField = z.string().describe(field.description)
				break
			case 'number':
				zodField = z.number().describe(field.description)
				break
			case 'enum':
				if (field.choices == null || field.choices.length === 0) {
					throw new Error(`Enum field must have choices: ${field.name}`)
				}
				zodField = z
					.enum([field.choices[0], ...field.choices.slice(1)] as [string, ...string[]])
					.describe(field.description)
				break
			default:
				throw new Error(`Unsupported type: ${field.type}`)
		}
		if (!field.required) {
			zodField = zodField.optional()
		}
		schemaObject[field.name] = zodField
	}

	schemaObject.comments = z
		.string()
		.optional()
		.describe('Any additional information or comments you would like to add')

	const structured = // TODO is this name passed to openai? make it meaningful if so
		z.object({
			// ts-expect-error Type instantiation is excessively deep
			items: z.array(
				// TODO only array if type==Listable
				z.object(schemaObject)
			),
			// .describe('some description'), // TODO
		})

	return structured
}

function checkUniquePropertyNames(properties: Field[]) {
	const uniqueNames = new Set(properties.map((field) => field.name))
	if (properties.length !== uniqueNames.size) {
		throw new Error(
			`Property names must be unique, but found duplicates: ${properties.map((field) => field.name).sort()}`
		)
	}
}

export function toHtml(thing: unknown, options?: ToHtmlOptions): string {
	if (thing == null) {
		throw new Error('toHtml: argument is null or undefined')
	}

	if (typeof thing === 'object' && Object.keys(thing).length === 1) {
		const theKey: string = Object.keys(thing)[0]
		const theValue = Object.values(thing)[0]
		if (options?.ignoreSingleKeyNames?.includes(theKey)) {
			return toHtml(theValue, options)
		}
	}

	if (Array.isArray(thing)) {
		return arrayToHtml(thing, options)
	} else if (typeof thing === 'object' && thing !== null) {
		// @ts-expect-error TS doesn't map type===`object` to Record<string, unknown>
		return hashToHtml(thing, options)
	} else {
		return String(thing)
	}
}

function arrayToHtml(arr: unknown[], options?: ToHtmlOptions): string {
	let listItems = arr.map((item) => `<li>${toHtml(item, options)}</li>`).join('\n')
	if (listItems.trim() === '') {
		listItems = '<li>(Unknown)</li>'
	}
	return `<ol class="array">\n${listItems}\n</ol>`
}

function hashToHtml(hash: { [key: string]: unknown }, options?: ToHtmlOptions): string {
	const priorityKeys = options?.priorityKeys ?? []
	let listItems = Object.entries(hash)
		.sort(([key1], [key2]) => {
			const priority1 = priorityKeys.indexOf(key1)
			const priority2 = priorityKeys.indexOf(key2)
			// comments always go last:
			if (key1.trim().toLowerCase() === 'comments') {
				return 1
			}
			if (key2.trim().toLowerCase() === 'comments') {
				return -1
			}
			if (priority1 !== -1 && priority2 !== -1) {
				return priority1 - priority2
			} else if (priority1 !== -1) {
				return -1
			} else if (priority2 !== -1) {
				return 1
			} else {
				return key1.localeCompare(key2)
			}
		})
		.map(([key, value]) => `<li><strong>${key}:</strong> ${toHtml(value, options)}</li>`)
		.join('\n')
	if (listItems.trim() === '') {
		listItems = '<li>(Unknown)</li>'
	}
	return `<ul class="hash">\n${listItems}\n</ul>`
}
