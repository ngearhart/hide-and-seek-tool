<template>
  <v-container style="width: 100%; height: 100%;">
    <v-row>
      <v-col>
        <v-card title="Custom Rules and Reminders">
          <v-card-text>
            <ul style="margin: 2em;">
              <li v-for="rule in rules" :key="rule">{{ rule }}</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card title="Turn Changeover Checklist">
          <v-card-text>
            <ul style="margin: 2em;">
              <li v-for="ch in checklist" :key="ch">{{ ch }}</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>

const rules = [
  "We are playing a Small game. Always use the effects specified with an \"S\" for medium on the cards or rulebook.",
  "\"Public transportation\" is PRT \"T\", PRT buses, and the Inclines. However, T stations and Incline stations are zones.",
  "The hider must be off of a train before their hiding period is done. However, if they are on a bus, they must make a best-effort to get to the nearest station.",
  "Due to the high headways of the T, it may be too easy to figure out where the hiders go during a hiding period by watching arrivals at the given station. Therefore, live tracking of the T is not permitted during the hiding period.",
  "It's likely things will come up that aren't clear in the rules. When in doubt, do your best according to the \"spirit of the game.\"",
  "No Administrative Divisions are useful. Do not use these questions.",
  "HAVE FUN!",
]

const checklist = [
  "Ask if everyone feels alright despite the cold",
  "Hand over tracker notepad",
  "Hand over hider deck",
  "Switch over Life360",
]

</script>
