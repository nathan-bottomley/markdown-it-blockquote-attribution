# markdown-it-blockquote-attribution

A `markdown-it` plugin that creates a simple syntax for adding attributions to blockquotes.

## Usage

```js
import MarkdownIt from 'markdown-it'
import MarkdownItBlockquoteAttribution from 'markdown-it-blockquote-attribution'

const md = MarkdownIt().use(MarkdownItBlockquoteAttribution)
```

## Syntax

The `markdown-it-blockquote-attribution` plugin examines each blockquote in a Markdown document, looking for a marker inside that blockquote. By default, that marker will be:

- an em-dash at the start of a paragraph, or
- an em-dash preceded by a line break.

The plugin will interpret the rest of that paragraph after the marker as the blockquote's attribution — that is, the source of the quote.

Here are a couple of examples.

```markdown
> "Sometimes you just have to bow to the absurd."
>
> — Jean-Luc Picard
```

```markdown
> "When I first read that script, I couldn't believe they were going to shoot it."
> — Robert Duncan McNeill
```

## Output

The output of the plugin conforms to [the advice given in the WHATWG HTML specification][whatwg].

- Content inside a `blockquote` must be quoted from another source
- Attribution for the quotation, if any, must be placed outside the blockquote element

[whatwg]: https://html.spec.whatwg.org/multipage/grouping-content.html#the-blockquote-element

And so, by default, the examples above produce this HTML:

```html
<figure class="quote">
  <blockquote>
    <p>"Sometimes you just have to bow to the absurd."</p>
  </blockquote>
  <figcaption class="attribution">Jean-Luc Picard</figcaption>
</figure>
```

```html
<figure class="quote">
  <blockquote>
    <p>"When I first read that script, I couldn't believe they were going to shoot it."</p>
  </blockquote>
  <figcaption class="attribution">Robert Duncan McNeill</figcaption>
</figure>
```

## Options

`markdown-it-blockquote-attribution` supports the following options:

| Option | Type | Default | Description |
| -- | -- | -- | -- |
| marker | string | `—` | The marker to use for attribution. |
| removeMarker | boolean | `true` | Whether to remove the marker from the attribution text. |
| containerClass | string | `quote` | The class name to apply to the `figure` element. |
| attributionClass | string | `attribution` | The class name to apply to the `figcaption` element. |

## Limitations

- A `blockquote` can have a `cite` attribute, which should contain the URL of the source of the quote. If there are any URLs in the text of the attribution, the first of them will be set as the value of the `cite` attribute. It is not currently possible to specify a custom value for this attribute.
- Only top-level blockquotes are checked for attribution. Content inside a nested blockquote is left as ordinary Markdown — an attribution marker there is not stripped or wrapped, and will just render as plain text.

## Acknowledgements

This plugin was inspired by
[markdown-it-attribution](https://github.com/dweidner/markdown-it-attribution) by Daniel Weidner.
