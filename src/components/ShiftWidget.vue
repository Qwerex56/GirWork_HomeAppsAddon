<script setup lang="ts">
import { onMounted } from 'vue'
import { useSession } from '../composables/useSession'
import { HmList, HmStat, HmWallTile, HmWidget, useCollection, useWidget } from '@home-apps/vue'

const { size, isWall } = useWidget()

</script>


<template>
    <HmWallTile v-if="isWall" icon="XD" :value="'Chuj'">
    </HmWallTile>

    <HmWidget>
        <p v-if="size === 'Small'">
            mały
        </p>
        <p v-else-if="size === 'Medium'">
            Średni
        </p>
        <p v-else>
            Duzy
        </p>
    </HmWidget>
</template>


<style lang="css" scoped>

</style>