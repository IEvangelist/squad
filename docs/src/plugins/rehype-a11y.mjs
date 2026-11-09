import { visit } from 'unist-util-visit';

function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children || []).map(textOf).join('');
}

/**
 * Rehype plugin with markdown accessibility fixes:
 * - Wide tables scroll horizontally, so they must be keyboard-focusable (axe: scrollable-region-focusable).
 * - GFM task-list checkboxes get an accessible name from their list item text (axe: label).
 * - Empty table header cells get hidden text (axe: empty-table-header).
 * - Pages whose markdown has no H1 get a visually hidden one from frontmatter (axe: page-has-heading-one).
 */
export function rehypeA11y() {
  return (tree, file) => {
    let hasH1 = false;
    visit(tree, 'element', (node) => {
      node.properties = node.properties || {};
      if (node.tagName === 'h1') hasH1 = true;
      if (node.tagName === 'table') node.properties.tabIndex = 0;
      if ((node.tagName === 'th') && !textOf(node).trim() && !(node.children || []).some((c) => c.type === 'element')) {
        node.children = [{ type: 'element', tagName: 'span', properties: { className: ['sr-only'] }, children: [{ type: 'text', value: 'Item' }] }];
      }
      if (node.tagName === 'li' && String(node.properties.className ?? '').includes('task-list-item')) {
        const label = textOf(node).trim();
        visit(node, 'element', (child) => {
          if (child.tagName === 'input' && child.properties?.type === 'checkbox' && label) {
            child.properties.ariaLabel = label;
          }
        });
      }
    });

    const title = file?.data?.astro?.frontmatter?.title;
    if (!hasH1 && title) {
      tree.children.unshift({
        type: 'element',
        tagName: 'h1',
        properties: { className: ['sr-only'] },
        children: [{ type: 'text', value: title }],
      });
    }
  };
}
