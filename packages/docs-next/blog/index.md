---
title: Nadle blog
description: Read blog posts about Nadle from the team
aside: false
---

<script setup lang="ts">
import { data as posts } from "./posts.data.ts";
</script>

# Nadle blog

Release notes and tips from the team. Subscribe through the [RSS feed](/rss.xml).

<ul>
  <li v-for="post in posts" :key="post.url">
    <a :href="post.url">{{ post.title }}</a> <small>{{ post.date }}</small>
    <p>{{ post.description }}</p>
  </li>
</ul>
