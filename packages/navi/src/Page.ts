import { Resolution, Resolvable, Status, reduceStatuses } from './Resolver'
import { SegmentType, PageSegment, createSegment } from './Segments'
import { NodeMatcher, NodeMatcherResult, NaviNodeBase, NaviNodeType, NodeMatcherOptions } from './Node'

export interface Page<Context extends object = any, Meta extends object = any, Content = any>
  extends NaviNodeBase<Context, PageMatcher<Context, Meta, Content>> {
  type: NaviNodeType.Page

  new (options: NodeMatcherOptions<Context>): PageMatcher<
    Context,
    Meta,
    Content
  >

  title?: string
  getTitle?: Resolvable<string>
  meta?: Meta
  getMeta?: Resolvable<Meta>
  content?: Content
  getContent?: Resolvable<Content>
}


export class PageMatcher<Context extends object, Meta extends object, Content> extends NodeMatcher<Context> {
  ['constructor']: Page<Context, Meta, Content>

  static isNode = true
  static type: NaviNodeType.Page = NaviNodeType.Page

  protected execute(): NodeMatcherResult<PageSegment<Meta, Content>> {
    let resolutionIds: number[] = []
    let status: Status = Status.Ready
    let error: any

    let content: Content | undefined
    if (this.withContent && this.constructor.getContent) {
      let contentResolution = this.resolver.resolve(this.env, this.constructor.getContent)
      resolutionIds.push(contentResolution.id)
      content = contentResolution.value
      status = reduceStatuses(status, contentResolution.status)
      error = error || contentResolution.error
    }
    else {
      content = this.constructor.content
    }
    
    let title: string | undefined
    if (this.constructor.getTitle) {
      let titleResolution = this.resolver.resolve(this.env, this.constructor.getTitle)
      resolutionIds.push(titleResolution.id)
      title = titleResolution.value
      status = reduceStatuses(status, titleResolution.status)
      error = error || titleResolution.error
    }
    else {
      title = this.constructor.title
    }
    
    let meta: Meta | undefined
    if (this.constructor.getMeta) {
      let metaResolution = this.resolver.resolve(this.env, this.constructor.getMeta)
      resolutionIds.push(metaResolution.id)
      meta = metaResolution.value
      status = reduceStatuses(status, metaResolution.status)
      error = error || metaResolution.error
    }
    else {
      meta = this.constructor.meta
    }
    
    return {
      resolutionIds: resolutionIds,
      segment: createSegment(SegmentType.Page, this.env, {
        title,
        meta: meta || {},
        status,
        error,
        content,
        remainingSegments: [],
      }),
    }
  }
}

export function createPage<Context extends object, Meta extends object, Content>(options: {
  title?: string
  getTitle?: Resolvable<string>
  meta?: Meta
  getMeta?: Resolvable<Meta>
  content?: Content
  getContent?: Resolvable<Content, Context>
}): Page<Context, Meta, Content> {
  if (process.env.NODE_ENV !== 'production') {
    let { title, getTitle, meta, getMeta, content, getContent, ...other } = options

    let unknownKeys = Object.keys(other)
    if (unknownKeys.length) {
      console.warn(
        `createPage() received unknown options ${unknownKeys
          .map(x => `"${x}"`)
          .join(', ')}.`,
      )
    }

    if (title === undefined && getTitle === undefined) {
      console.warn(
        `createPage() should be called with a "title" or "getTitle" option. If you're sure you don't want to set a title, you can silence this warning by passing "null" as the title.`,
      )
    }
  }

  return class extends PageMatcher<Context, Meta, Content> {
    static title = options.title
    static getTitle = options.getTitle
    static meta = options.meta
    static getMeta = options.getMeta
    static content = options.content
    static getContent = options.getContent
  }
}
