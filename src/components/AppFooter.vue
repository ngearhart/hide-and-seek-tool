<template>
  <v-footer height="40" app>
    <a
      href="/"
      title="Homepage"
      class="d-inline-block mx-2 social-link"
      rel="noopener noreferrer"
      target="_blank"
    >
      <v-img :width="25" src="@/assets/hideandseek.png"></v-img>
    </a>
    <a
      v-for="item in items"
      :key="item.title"
      :href="item.href"
      :title="item.title"
      class="d-inline-block mx-2 social-link"
      rel="noopener noreferrer"
      target="_blank"
    >
      <v-icon
        :icon="item.icon"
        :size="item.icon === '$vuetify' ? 24 : 16"
      />
    </a>

    <div
      class="text-caption text-disabled"
      style="position: absolute; right: 16px;"
    >
      &copy; 2025-{{ (new Date()).getFullYear() }} <span class="d-none d-sm-inline-block">Noah G</span>
      —
      <a
        class="text-decoration-none on-surface"
        href="https://www.gnu.org/licenses/gpl-3.0.en.html"
        rel="noopener noreferrer"
        target="_blank"
      >
        Open Source Under GNU GPL v3 License 
      </a>
    </div>
  </v-footer>
</template>

<script setup lang="ts">
  const items = [
    {
      title: 'HideSeek.Live GitHub',
      icon: `mdi-github`,
      href: 'https://github.com/ngearhart/hide-and-seek-tool',
    },
    {
      title: 'Purchase the Game',
      icon: `mdi-open-in-new`,
      href: 'https://store.nebula.tv/products/hideandseek',
    },
  ]
</script>

<style scoped lang="sass">
  .social-link :deep(.v-icon)
    color: rgba(var(--v-theme-on-background), var(--v-disabled-opacity))
    text-decoration: none
    transition: .2s ease-in-out

    &:hover
      color: rgba(25, 118, 210, 1)
</style>
