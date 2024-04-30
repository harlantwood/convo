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

	return z.object(schemaObject)
}

function checkUniquePropertyNames(properties: Field[]) {
	const uniqueNames = new Set(properties.map((field) => field.name))
	if (properties.length !== uniqueNames.size) {
		throw new Error('Property names must be unique')
	}
}
