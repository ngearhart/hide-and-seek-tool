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
    subtitle: "Curse of Pittsburgh Stairs",
    description: "Seekers must find nearby stairs and climb them continuously for 5 minutes before asking another question. Breaks for landings are permitted. Stairs may only be descended if they will be re-ascended.",
    cost: "Discard 2 cards."
  },
  {
    title: "Curse B",
    subtitle: "Curse of Yinz",
    description: "Seekers find a word of Pittsburghese printed on a piece of media, take a photo of it, and send it to the hiders before asking another question. It does not need to be used in the \"correct\" context. See the list here: http://www.pittsburghese.com/",
    cost: "Send the seekers an equivalent photo. The photo may be censored to prevent location discovery."
  },
  {
    title: "Curse C",
    subtitle: "Curse of Funk Function",
    description: "Seekers must visit any station with the word Junction in the name and send a video with them singing \"Conjunction Junction\" for 5 seconds to the hiders before asking another question.",
    cost: "Seekers must be on a different line than any line that services your current home station."
  },
]

</script>
