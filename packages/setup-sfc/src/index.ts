import { createUnplugin } from 'unplugin'
import { createFilter } from '@rollup/pluginutils'
import { SETUP_SFC_REGEX, hotUpdateSetupSFC, transfromSetupSFC } from './core'
import type { FilterPattern } from '@rollup/pluginutils'

export interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
}

export type OptionsResolved = Omit<Required<Options>, 'exclude'> & {
  exclude?: FilterPattern
}

function resolveOption(options: Options): OptionsResolved {
  return {
    include: [SETUP_SFC_REGEX],
    ...options,
  }
}

const name = 'unplugin-vue-setup-sfc'

export default createUnplugin((userOptions: Options = {}) => {
  const options = resolveOption(userOptions)
  const filter = createFilter(options.include, options.exclude)

  return {
    name,

    transformInclude(id) {
      return filter(id)
    },

    transform(code, id) {
      try {
        return transfromSetupSFC(code, id)
      } catch (err: unknown) {
        this.error(`${name} ${err}`)
      }
    },

    vite: {
      config() {
        return {
          esbuild: {
            exclude: options.include as any,
            include: options.exclude as any,
          },
        }
      },

      handleHotUpdate: (ctx) => {
        if (filter(ctx.file)) {
          return hotUpdateSetupSFC(ctx, filter)
        }
      },
    },
  }
})