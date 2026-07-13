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
  "\"Public transportation\" is defined as subways, commuter trains, buses, gondola, and ferries. However, ONLY MTA Subway stations are zones (as defined on this site). Amtrak is not permitted (although it would not be useful).",
  "The hider must be off of a train before their hiding period is done. However, if they are on a bus, they must make a best-effort to get to the nearest station.",
  "It's likely things will come up that aren't clear in the rules. When in doubt, do your best according to the \"spirit of the game.\"",
  "First Administrative Division is NYC Boroughs.",
  "Second Administrative Division is NYC Council districts - please use the \"Districts\" feature on this site to confirm.",
  "No Third or Fourth Administrative Divisions exist. Do not use these questions.",
  "Do not ask distance from closest mountain.",
  "Do not ask distance from nearest international border.",
  "The Acela (via Northeast Corridor) does count as high speed rail for the high speed rail line question.",
  "The game will officially end no later than 4pm.",
  "Both teams should track initial hide time (45 minutes) and total hiding period.",
  "!NEW! The hiders are responsible for tracking the time until the last time the seekers start the endgame (best effort) as a contingency if we have to shorten turns.",
  "As the hiders have a lot more \"chill time\" than the seekers, the hiders should be generally responsible for knowing where the seekers are located to answer questions. However, especially while on the subway, it might be advisable for seekers to ensure that the tracker has updated.",
  "The final hiding spot must be publicly accessible and open from 7am-4pm.",
  "HAVE FUN!",
]

const checklist = [
  "Make sure Life360, Ferry app, and MTA TrainTime apps are downloaded",
  "Ask if everyone feels alright despite the heat",
  "Apply sunscreen",
  "Hand over tracker notepad",
  "Hand over hider deck",
  "Switch over Life360",
]

</script>
