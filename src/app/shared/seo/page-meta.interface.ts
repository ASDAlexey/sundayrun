/**
 * One rewritable `<meta>` tag. `Meta` finds a tag by the attribute that identifies it, and the two
 * families in `index.html` disagree about which one that is: Open Graph tags carry `property`,
 * everything else (`description`, the twitter card) carries `name`.
 */
export interface PageMetaTag {
  attribute: 'name' | 'property';
  /** The value of that attribute — «og:url», «description». */
  value: string;
}
