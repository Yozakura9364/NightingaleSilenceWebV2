<script setup lang="ts">
// ContentRichText.vue — public rich-text renderer (T041). Consumes only the
// validated SafeDocumentViewModel; every branch renders known nodes through
// dedicated Vue components. No v-html, no arbitrary HTML, no Tiptap.
import type { Align, HeadingLevel, SafeDocumentViewModel } from '@/lib/content/render/contentViewModel'
import ContentTable from './ContentTable.vue'
import ContentGallery from './ContentGallery.vue'
import ContentFigure from './ContentFigure.vue'
import ContentCollapse from './ContentCollapse.vue'
import RenderText from './RenderText.vue'

defineProps<{ document: SafeDocumentViewModel }>()

function textAlignClass(align: Align | null): string {
  return align ? `ns-align-${align}` : ''
}
function headingClass(level: HeadingLevel): string {
  return `ns-heading-${level}`
}
</script>

<template>
  <div class="ns-content">
    <template v-for="(block, i) in document.blocks" :key="i">
      <!-- paragraph -->
      <p
        v-if="block.kind === 'paragraph'"
        class="ns-paragraph"
        :class="textAlignClass(block.textAlign)"
      >
        <template v-for="(child, j) in block.children" :key="j">
          <RenderText v-if="child.kind === 'text'" :text="child.text" :marks="child.marks" />
          <br v-else />
        </template>
      </p>

      <!-- heading (level validated to 2/3/4 by the view model) -->
      <component
        :is="`h${block.level}`"
        v-else-if="block.kind === 'heading'"
        class="ns-heading"
        :class="[headingClass(block.level), textAlignClass(block.textAlign)]"
      >
        <template v-for="(child, j) in block.children" :key="j">
          <RenderText v-if="child.kind === 'text'" :text="child.text" :marks="child.marks" />
          <br v-else />
        </template>
      </component>

      <!-- blockquote -->
      <blockquote v-else-if="block.kind === 'blockquote'" class="ns-blockquote">
        <ContentRichText :document="{ blocks: block.children }" />
      </blockquote>

      <!-- lists -->
      <ul v-else-if="block.kind === 'bulletList'" class="ns-list ns-list-bullet">
        <li v-for="(item, k) in block.children" :key="k" class="ns-list-item">
          <ContentRichText :document="{ blocks: item.children }" />
        </li>
      </ul>
      <ol
        v-else-if="block.kind === 'orderedList'"
        class="ns-list ns-list-ordered"
        :start="block.start"
      >
        <li v-for="(item, k) in block.children" :key="k" class="ns-list-item">
          <ContentRichText :document="{ blocks: item.children }" />
        </li>
      </ol>

      <!-- code block: plain interpolation only -->
      <pre v-else-if="block.kind === 'codeBlock'" class="ns-code" :data-language="block.language ?? undefined"><code>{{ block.text }}</code></pre>

      <!-- horizontal rule -->
      <hr v-else-if="block.kind === 'horizontalRule'" class="ns-hr" />

      <!-- table / image / gallery / collapse -->
      <ContentTable v-else-if="block.kind === 'table'" :rows="block.rows" />
      <ContentFigure v-else-if="block.kind === 'image'" :image="block" />
      <ContentGallery v-else-if="block.kind === 'gallery'" :gallery="block" />
      <ContentCollapse v-else-if="block.kind === 'collapse'" :title="block.title" :blocks="block.children" />
    </template>
  </div>
</template>
