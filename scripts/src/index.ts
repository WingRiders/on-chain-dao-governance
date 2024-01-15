/* eslint-disable no-console */
import {program} from 'commander'

import {sdk} from '@wingriders/governance-sdk'

program.name('manage-proposal').description('Manage a governance proposal').version('0.1.0')

program.command('report-sdk').action((_) => console.log(sdk))

program.parse()
