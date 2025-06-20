<template>
  <v-container style="width: 100%; height: 100%;">
    <v-row>
      <v-col cols="12" md="4" v-for="curse in curses" :key="curse.title">
        <v-card :title="curse.title" :subtitle="curse.subtitle" min-width="200" min-height="370" hover>
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
    subtitle: "Curse of Wheaton",
    description: "Seekers must spend 5 minutes on escalators before asking another question. They may briefly exit the escalator to walk across a landing but must immediately go to another escalator until the 5 minutes is up.",
    cost: "Discard 1 card."
  },
  {
    title: "Curse C",
    subtitle: "Curse of Forest Glen",
    description: "For the next hour, seekers may not use moving escalators at all. Non-functional, stationary escalators are allowed.",
    cost: "Send a voice memo to the hiders declaring your love for elevators."
  },
  {
    title: "Curse D",
    subtitle: "Curse of the Unhelpful Locals",
    description: "For the next half hour, the locals (Noah and Max) may not help make any decisions, including which transit to take, where to walk, which questions to ask, and which curses to apply. They may talk, but only about non-Hide-and-Seek related things. They are allowed to talk about rules.",
    cost: "The local on the hiders team also cannot make any decisions during the time period, especially which curses to use or cards to take."
  },
  {
    title: "Curse E",
    subtitle: "Curse of Opposite Day",
    description: "For the next half hour, seekers must always speak in opposites. If violated, seekers cannot take transit for 10 minutes (leave at the next stop if currently on transit).",
    cost: "Pick 3 Numbers between 1 and 6. Roll a die. If the die is any of those 3 numbers, this curse does not apply."
  },
  {
    title: "Curse F",
    subtitle: "Curse of the Sound of Silence",
    description: "For the next half hour, seekers cannot vocalize anything. Writing and texting is allowed. If violated (after each seeker is aware of the curse), seekers cannot take transit for 10 minutes (leave at the next stop if currently on transit).",
    cost: "The hiders cannot cast more curses, use Vetos, or use Randomize Question during the silence period."
  },
  {
    title: "Curse G",
    subtitle: "Curse of the Todd Take",
    description: "Seekers must visit any government office building and give a 1 minute speech about something they are passionate for before asking another question.",
    cost: "Seekers must be within 1/2 mile of a government office building."
  },
  
]

</script>
