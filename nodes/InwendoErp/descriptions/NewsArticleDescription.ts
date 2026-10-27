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
		description: 'Internal name of the article (not shown publicly)',
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
				description: 'Internal description (not shown publicly)',
			},
			{
				displayName: 'Highlight',
				name: 'highlight',
				type: 'boolean',
				default: false,
				description: 'Whether to highlight / feature this article on the public page',
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
				description: 'URL of the article cover / thumbnail image',
			},
			{
				displayName: 'News Type',
				name: 'newsType',
				type: 'options',
				options: [
					{ name: 'Event', value: 'NEWS_TYPE_EVENT' },
					{ name: 'Help Article', value: 'NEWS_TYPE_HELP' },
					{ name: 'News', value: 'NEWS_TYPE_NEWS' },
					{ name: 'Other', value: 'NEWS_TYPE_UNDEFINED' },
					{ name: 'Press Release', value: 'NEWS_TYPE_PRESS' },
					{ name: 'Sponsor', value: 'NEWS_TYPE_SPONSOR' },
					{ name: 'Wiki', value: 'NEWS_TYPE_SIMPLE_WIKI' },
				],
				default: 'NEWS_TYPE_NEWS',
				description: 'Category / type of the article',
			},
			{
				displayName: 'Public Author',
				name: 'publicAuthor',
				type: 'string',
				default: '',
				description: 'Author name shown on the public article page',
			},
			{
				displayName: 'Public Category',
				name: 'publicCategory',
				type: 'string',
				default: '',
				description: 'Public-facing category label',
			},
			{
				displayName: 'Public Copyright',
				name: 'publicCopyright',
				type: 'string',
				default: '',
				description: 'Copyright notice shown with the article',
			},
			{
				displayName: 'Public Description',
				name: 'publicDescription',
				type: 'string',
				default: '',
				description: 'Full body text shown on the public article page',
			},
			{
				displayName: 'Public Keywords',
				name: 'publicKeywords',
				type: 'string',
				default: '',
				description: 'Comma-separated SEO keywords for the article',
			},
			{
				displayName: 'Public Language Code',
				name: 'publicLanguageCode',
				type: 'string',
				default: '',
				description: 'Language code for the public content (e.g. de, en)',
			},
			{
				displayName: 'Public Subtitle',
				name: 'publicSubtitle',
				type: 'string',
				default: '',
				description: 'Subtitle shown on the public article page',
			},
			{
				displayName: 'Public Summary',
				name: 'publicSummary',
				type: 'string',
				default: '',
				description: 'Short teaser text shown in article listings',
			},
			{
				displayName: 'Public Title',
				name: 'publicTitle',
				type: 'string',
				default: '',
				description: 'Title shown on the public article page',
			},
			{
				displayName: 'Publish Date',
				name: 'publishDate',
				type: 'dateTime',
				default: '',
				description: 'Date and time when the article becomes publicly visible',
			},
			{
				displayName: 'Slug Identifier',
				name: 'slugIdentifier',
				type: 'string',
				default: '',
				description: 'URL-friendly identifier for the public article page (e.g. my-article-title)',
			},
			{
				displayName: 'Unpublish Date',
				name: 'unpublishDate',
				type: 'dateTime',
				default: '',
				description: 'Date and time when the article is automatically hidden',
			},
			{
				displayName: 'Visibility',
				name: 'visibilityType',
				type: 'options',
				options: [
					{ name: 'Public', value: 'public' },
					{ name: 'Selected Users / Tags', value: 'logged-in-explicit' },
					{ name: 'With Login', value: 'logged-in' },
					{ name: 'With Token', value: 'token' },
				],
				default: 'public',
				description: 'Who can see this article',
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
				displayName: 'Deleted',
				name: 'deleted',
				type: 'boolean',
				default: false,
				description: 'Whether to soft-delete this article',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Internal description (not shown publicly)',
			},
			{
				displayName: 'Highlight',
				name: 'highlight',
				type: 'boolean',
				default: false,
				description: 'Whether to highlight / feature this article on the public page',
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
				description: 'URL of the article cover / thumbnail image',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Internal name of the article (not shown publicly)',
			},
			{
				displayName: 'News Type',
				name: 'newsType',
				type: 'options',
				options: [
					{ name: 'Event', value: 'NEWS_TYPE_EVENT' },
					{ name: 'Help Article', value: 'NEWS_TYPE_HELP' },
					{ name: 'News', value: 'NEWS_TYPE_NEWS' },
					{ name: 'Other', value: 'NEWS_TYPE_UNDEFINED' },
					{ name: 'Press Release', value: 'NEWS_TYPE_PRESS' },
					{ name: 'Sponsor', value: 'NEWS_TYPE_SPONSOR' },
					{ name: 'Wiki', value: 'NEWS_TYPE_SIMPLE_WIKI' },
				],
				default: 'NEWS_TYPE_NEWS',
				description: 'Category / type of the article',
			},
			{
				displayName: 'Public Author',
				name: 'publicAuthor',
				type: 'string',
				default: '',
				description: 'Author name shown on the public article page',
			},
			{
				displayName: 'Public Category',
				name: 'publicCategory',
				type: 'string',
				default: '',
				description: 'Public-facing category label',
			},
			{
				displayName: 'Public Copyright',
				name: 'publicCopyright',
				type: 'string',
				default: '',
				description: 'Copyright notice shown with the article',
			},
			{
				displayName: 'Public Description',
				name: 'publicDescription',
				type: 'string',
				default: '',
				description: 'Full body text shown on the public article page',
			},
			{
				displayName: 'Public Keywords',
				name: 'publicKeywords',
				type: 'string',
				default: '',
				description: 'Comma-separated SEO keywords for the article',
			},
			{
				displayName: 'Public Language Code',
				name: 'publicLanguageCode',
				type: 'string',
				default: '',
				description: 'Language code for the public content (e.g. de, en)',
			},
			{
				displayName: 'Public Subtitle',
				name: 'publicSubtitle',
				type: 'string',
				default: '',
				description: 'Subtitle shown on the public article page',
			},
			{
				displayName: 'Public Summary',
				name: 'publicSummary',
				type: 'string',
				default: '',
				description: 'Short teaser text shown in article listings',
			},
			{
				displayName: 'Public Title',
				name: 'publicTitle',
				type: 'string',
				default: '',
				description: 'Title shown on the public article page',
			},
			{
				displayName: 'Publish Date',
				name: 'publishDate',
				type: 'dateTime',
				default: '',
				description: 'Date and time when the article becomes publicly visible',
			},
			{
				displayName: 'Slug Identifier',
				name: 'slugIdentifier',
				type: 'string',
				default: '',
				description: 'URL-friendly identifier for the public article page (e.g. my-article-title)',
			},
			{
				displayName: 'Unpublish Date',
				name: 'unpublishDate',
				type: 'dateTime',
				default: '',
				description: 'Date and time when the article is automatically hidden',
			},
			{
				displayName: 'Visibility',
				name: 'visibilityType',
				type: 'options',
				options: [
					{ name: 'Public', value: 'public' },
					{ name: 'Selected Users / Tags', value: 'logged-in-explicit' },
					{ name: 'With Login', value: 'logged-in' },
					{ name: 'With Token', value: 'token' },
				],
				default: 'public',
				description: 'Who can see this article',
			},
		],
	},
];
