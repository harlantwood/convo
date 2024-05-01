import { z } from 'zod'
import type { ZodObject, ZodRawShape, ZodTypeAny } from 'zod'

type Field = {
	name: string
	type: string
	description: string
	choices: string[]
	required: boolean
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
				zodField = z.enum(field.choices).describe(field.description)
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

	const structured = // TODO is this name passed to openai? make meanifufl if so
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
		throw new Error('Property names must be unique')
	}
}

export function objectToHtml(obj: unknown): string {
	if (Array.isArray(obj)) {
		return arrayToHtml(obj)
	} else if (typeof obj === 'object' && obj !== null) {
		// @ts-expect-error TS doesn't map type===`object` to Record<string, unknown>
		return hashToHtml(obj)
	} else {
		return String(obj)
	}
}

function arrayToHtml(arr: unknown[]): string {
	const listItems = arr.map((item) => `<li>${objectToHtml(item)}</li>`).join('')
	return `<ol>${listItems}</ol>`
}

function hashToHtml(hash: { [key: string]: unknown }): string {
	const listItems = Object.entries(hash)
		.map(([key, value]) => `<li><strong>${key}:</strong> ${objectToHtml(value)}</li>`)
		.join('')
	return `<ul class="hash">${listItems}</ul>`
}
