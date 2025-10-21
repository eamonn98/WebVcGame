import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

const vuetify = createVuetify({
  blueprint: md3,
  theme: {
    defaultTheme: 'dark',
  },
})

export default vuetify
