import type { INodeProperties } from 'n8n-workflow';

export const newsArticleOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['newsArticle'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a news article',
				action: 'Create a news article',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a news article by ID',
				action: 'Get a news article',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many news articles',
				action: 'Get many news articles',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a news article (PATCH)',
				action: 'Update a news article',
			},
		],
		default: 'getAll',
	},
];

export const newsArticleFields: INodeProperties[] = [
	{
		displayName: 'News Article ID',
		name: 'newsArticleId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['newsArticle'],
				operation: ['get', 'update'],
			},
		},
		description: 'The ID of the news article',
	},

	// ----------------------------------
	//         newsArticle:getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['newsArticle'],
				operation: ['getAll'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['newsArticle'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Search String',
		name: 'searchString',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['newsArticle'],
				operation: ['getAll'],
			},
		},
		description: 'Search string to filter news articles',
	},

	// ----------------------------------
	//         newsArticle:create
	// ----------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['newsArticle'],
				operation: ['create'],
			},
		},
		description: 'Internal name of the article',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['newsArticle'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'News Type',
				name: 'newsType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Visibility Type',
				name: 'visibilityType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Title',
				name: 'publicTitle',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Subtitle',
				name: 'publicSubtitle',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Author',
				name: 'publicAuthor',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Summary',
				name: 'publicSummary',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Description',
				name: 'publicDescription',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Language Code',
				name: 'publicLanguageCode',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Keywords',
				name: 'publicKeywords',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Category',
				name: 'publicCategory',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Slug Identifier',
				name: 'slugIdentifier',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Publish Date',
				name: 'publishDate',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Unpublish Date',
				name: 'unpublishDate',
				type: 'dateTime',
				default: '',
			},
		],
	},

	// ----------------------------------
	//         newsArticle:update
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['newsArticle'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
			},
			{
				displayName: 'News Type',
				name: 'newsType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Visibility Type',
				name: 'visibilityType',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Deleted',
				name: 'deleted',
				type: 'boolean',
				default: false,
			},
			{
				displayName: 'Public Title',
				name: 'publicTitle',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Subtitle',
				name: 'publicSubtitle',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Author',
				name: 'publicAuthor',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Summary',
				name: 'publicSummary',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Description',
				name: 'publicDescription',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Keywords',
				name: 'publicKeywords',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Public Category',
				name: 'publicCategory',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Slug Identifier',
				name: 'slugIdentifier',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Publish Date',
				name: 'publishDate',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Unpublish Date',
				name: 'unpublishDate',
				type: 'dateTime',
				default: '',
			},
		],
	},
];
