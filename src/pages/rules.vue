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
  "We are playing a Medium game. Always use the effects specified with an \"M\" for medium on the cards or rulebook.",
  "The hiding period is 45 minutes instead of an hour.",
  "\"Public transportation\" is defined as everything a Smartrip card can buy, MARC, and VRE. However, ONLY metrorail stations are zones.",
  "The Pentagon station is banned from being a hider zone station. However, you are allowed to connect to and from the station on rail or bus.",
  "The hider must be off of a train before their hiding period is done. However, if they are on a bus, they must make a best-effort to get to the nearest station.",
  "It's likely things will come up that aren't clear in the rules. When in doubt, do your best according to the \"spirit of the game.\"",
  "First Administrative Division is VA, MD, or DC.",
  "Second Administrative Division is County in the States and DC itself.",
  "No Third or Fourth Administrative Divisions exist. Do not use these questions.",
  "HAVE FUN!",
]

const checklist = [
  "Ask if everyone feels alright despite the heat",
  "Apply another coat of sunscreen",
  "Hand over tracker notepad",
  "Hand over hider deck",
  "Switch over Life360",
]

</script>
