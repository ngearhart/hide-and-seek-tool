<template>
  <v-dialog max-width="600" v-model="isDialogOpen" transition="dialog-bottom-transition">
    <v-card title="Game Creator" :disabled="loading" :loading="loading">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
      </template>
      <v-form @submit.prevent="submit">
        <v-card-text>
          <v-container>
            <v-row align="center" justify="center" v-for="team in teams" :key="team.id">
              <v-col cols="12" md="10">
                <v-text-field v-model="team.name" label="Enter team name" :rules="rules"></v-text-field>
              </v-col>
              <v-col cols="12" md="2">
                <v-btn color="red" v-if="team.id > 1" v-on:click="rmTeam(team.id)" icon="mdi-close"></v-btn>
              </v-col>
            </v-row>
            <v-row align="center" justify="center">
              <v-col cols="12" md="12">
                <v-btn prepend-icon="mdi-plus" block color="primary"
                  v-on:click="teams.push({ id: teams.length, name: '' })">Add another
                  team</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-container>
            <v-row align="center" justify="center">
              <v-col cols="12" md="6">
                <v-btn prepend-icon="mdi-check-circle" variant="tonal" color="green" block type="submit" :disabled="teams.length == 0">Confirm</v-btn>
              </v-col>
              <v-col cols="12" md="6">
                <v-btn prepend-icon="mdi-close" variant="tonal" @click="isDialogOpen = false" block>Back</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>

const emit = defineEmits<{
  (e: 'submit', teams: { id: number, name: string }[]): void
}>();

const isDialogOpen = defineModel<boolean>()
const teams = ref([{id: 0, name: ''}, {id: 1, name: ''}]);
const loading = ref(false);

const rules = [
    (value: string | null) => {
      if (value) return true
      return 'Team name must not be empty'
    },
  ]


const rmTeam = (id: number) => {
  const newTeams = [];
  for (const team of teams.value) {
    if (team.id != id) {
      newTeams.push({
        id: newTeams.length,
        name: team.name
      })
    }
  }
  teams.value = newTeams;
}

const submit = (e: any) => {
  e.then((r: { valid: boolean }) => {
    if (r.valid) {
      loading.value = true;
      emit('submit', teams.value);
    }
  })
}

</script>