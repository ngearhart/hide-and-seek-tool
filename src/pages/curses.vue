<template>
  <v-container style="width: 100%; height: 100%;">
    <v-row>
      <v-col cols="12" md="4" v-for="curse in curses" :key="curse.title">
        <v-card :title="curse.title" :subtitle="curse.subtitle" min-width="200" min-height="370">
          <v-card-text>
            <v-container>
              <v-row>
                <v-col>
                  {{ curse.description }}
                </v-col>
              </v-row>
              <v-spacer></v-spacer>
              <v-row style="position: absolute; bottom: 2em; margin-right: 1em;">
                <v-col>
                  <strong>Casting Cost: </strong>{{ curse.cost }}
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>

const curses = [
  {
    title: "Curse A",
    subtitle: "Curse of Buses are Awesome, Too",
    description: "The next transit trip the seekers make must be by bus.",
    cost: "Discard 2 cards."
  },
  {
    title: "Curse B",
    subtitle: "Curse of Robert Moses",
    description: "With only 1 attempt, set a 5-minute timer and count how many vehicle honks occur nearby (in a 1-block radius). The seekers are then prohibited from asking any more questions until they count at least as many nearby vehicle honks.",
    cost: "Seekers must not be on transit."
  },
  {
    title: "Curse C",
    subtitle: "Curse of Fuhgeddaboudit",
    description: "For the next 20 minutes, the seekers must say \"I'm walkin' here!\" every time they cross the street.",
    cost: "None."
  },
  {
    title: "Curse D",
    subtitle: "Curse of Jimmy Kimmel",
    description: "NYC is infamous for performers solititing cash throughout the city in transit stations and public spaces, also called busking. The seekers must find someone busking and listen or watch them for 5 minutes before asking another question (expires after 30 minutes).",
    cost: "The hiders must also listen or watch to someone busking in their hiding zone for 5 minutes."
  }
]

</script>
