# Hide and Seek LIVE

## Adding A New Region

Would recommend using a tool like https://geojson.io/

You must also add the following keys to the root object:

| Key Name | Key Value          | Description                                                       |
|----------|--------------------|-------------------------------------------------------------------|
| name     | *Name of Region*   | The name that this region should use on the map                   |
| size     | small,medium,large | The recommended game size. This will influence parts of the game. |
| center   | [*lat*, *lng*]      | A lat, long pair that represents the map center.                  |

Feature Properties:

| Property Name | Property Value                                                    | Description                                                                                                |
|---------------|-------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Name          | *Name of Feature*                                                 | The name that this feature should use on the map, for example, the name of the transit station or library. |
| Type          | station,airport,museum,theater,hospital,library,zoo,aquarium,park | The type of thing this feature describes.                                                                  |
| Description   | *Description*                                                     | An optional description, a second line in the UI.                                                          |

## Feature Requests

- What-If mode to quickly undo
- High priority changes (require an extra click to delete, "lock in")
- Quick undo
- Better team configuration (each team wouldn't see each other's maps/configurable)

## PIXI.js

Note: The Leaflet plugin only supports up to Pixi.js major version 7.

## Developing
H&SL was developed using Vuetify. See below for more info. Vuetify is available under the [MIT License](http://opensource.org/licenses/MIT), Copyright (c) 2016-present Vuetify, LLC.

### Vuetify Links

- 📄 [Docs](https://vuetifyjs.com/)
- 🚨 [Issues](https://issues.vuetifyjs.com/)
- 🏬 [Store](https://store.vuetifyjs.com/)
- 🎮 [Playground](https://play.vuetifyjs.com/)
- 💬 [Discord](https://community.vuetifyjs.com)

### 💿 Install

Set up your project using your preferred package manager. Use the corresponding command to install the dependencies:

| Package Manager                                                | Command        |
|---------------------------------------------------------------|----------------|
| [yarn](https://yarnpkg.com/getting-started)                   | `yarn install` |
| [npm](https://docs.npmjs.com/cli/v7/commands/npm-install)     | `npm install`  |
| [pnpm](https://pnpm.io/installation)                          | `pnpm install` |
| [bun](https://bun.sh/#getting-started)                        | `bun install`  |

After completing the installation, your environment is ready for Vuetify development.

### Starting the Development Server

To start the development server with hot-reload, run the following command. The server will be accessible at [http://localhost:3000](http://localhost:3000):

```bash
yarn dev
```

(Repeat for npm, pnpm, and bun with respective commands.)

> Add NODE_OPTIONS='--no-warnings' to suppress the JSON import warnings that happen as part of the Vuetify import mapping. If you are on Node [v21.3.0](https://nodejs.org/en/blog/release/v21.3.0) or higher, you can change this to NODE_OPTIONS='--disable-warning=5401'. If you don't mind the warning, you can remove this from your package.json dev script.

### Building for Production

To build your project for production, use:

```bash
yarn build
```

(Repeat for npm, pnpm, and bun with respective commands.)

Once the build process is completed, your application will be ready for deployment in a production environment.

## Color Palette

https://coolors.co/5e3408-fffcf2-0d3b66-f4d666-eb5e28-faf0ca-a663cc-669bbc-84a98c-03071e

- Transit Stations #5E3408
- Airports #FFFCF2
- Museums #0D3B66
- Movie Theaters #F4D666
- Hospitals #EB5E28
- Libraries #FAF0CA
- Zoos #A663CC
- Aquariums #669BBC
- Parks #84A98C
- Graveyards #03071E
- Custom Pins #C2095A
