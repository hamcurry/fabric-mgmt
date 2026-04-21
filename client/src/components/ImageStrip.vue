<template>
  <div v-if="images.length" class="img-strip">
    <!-- Hidden el-image for lightbox (uses the first as anchor) -->
    <el-image
      ref="lightboxRef"
      :src="images[0]"
      :preview-src-list="images"
      :initial-index="activeIndex"
      preview-teleported
      style="display:none"
    />

    <div
      v-for="(src, i) in visibleImages"
      :key="i"
      class="img-thumb"
      :style="{ width: size + 'px', height: size + 'px' }"
      @click.stop="openAt(i)"
    >
      <img :src="src" :style="{ width: size + 'px', height: size + 'px' }" />
    </div>

    <!-- +N overflow badge -->
    <div
      v-if="overflow > 0"
      class="img-thumb img-overflow"
      :style="{ width: size + 'px', height: size + 'px' }"
      @click.stop="openAt(maxVisible)"
    >
      +{{ overflow }}
    </div>
  </div>
  <span v-else-if="showEmpty" class="img-strip-empty">{{ emptyText }}</span>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
  size: { type: Number, default: 56 },
  maxVisible: { type: Number, default: 4 },
  showEmpty: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无图片' }
})

const lightboxRef = ref(null)
const activeIndex = ref(0)

const visibleImages = computed(() => props.images.slice(0, props.maxVisible))
const overflow = computed(() => Math.max(0, props.images.length - props.maxVisible))

function openAt(index) {
  activeIndex.value = index
  // Trigger el-image preview by clicking its hidden img
  lightboxRef.value?.$el?.querySelector('img')?.click()
}
</script>

<style scoped>
.img-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.img-thumb {
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: zoom-in;
  flex-shrink: 0;
  background: var(--color-bg-subtle);
  transition: opacity var(--dur-fast) var(--ease-standard);
}
.img-thumb:hover { opacity: 0.85; }
.img-thumb img {
  object-fit: cover;
  display: block;
}
.img-overflow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  cursor: zoom-in;
}
.img-strip-empty {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
