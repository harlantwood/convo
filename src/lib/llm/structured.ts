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

export function toHtml(obj: unknown, options?: ToHtmlOptions): string {
	console.log('in toHtml, options:', options)
	if (typeof obj === 'object' && obj !== null && Object.keys(obj).length === 1 && 'items' in obj) {
		return objectToHtml(obj.items, options)
	} else {
		return objectToHtml(obj, options)
	}
}

function objectToHtml(obj: unknown, options?: ToHtmlOptions): string {
	if (Array.isArray(obj)) {
		return arrayToHtml(obj, options)
	} else if (typeof obj === 'object' && obj !== null) {
		// @ts-expect-error TS doesn't map type===`object` to Record<string, unknown>
		return hashToHtml(obj, options)
	} else {
		return String(obj)
	}
}

function arrayToHtml(arr: unknown[], options?: ToHtmlOptions): string {
	const listItems = arr.map((item) => `<li>${objectToHtml(item, options)}</li>`).join('\n')
	return `<ol class="array">\n${listItems}\n</ol>`
}

function hashToHtml(hash: { [key: string]: unknown }, options?: ToHtmlOptions): string {
	const priorityKeys = options?.priorityKeys ?? []
	const listItems = Object.entries(hash)
		.sort(([key1], [key2]) => {
			console.log({ key1, key2, priorityKeys })
			const priority1 = priorityKeys.indexOf(key1)
			const priority2 = priorityKeys.indexOf(key2)
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
		.map(([key, value]) => `<li><strong>${key}:</strong> ${objectToHtml(value, options)}</li>`)
		.join('\n')
	return `<ul class="hash">\n${listItems}\n</ul>`
}
