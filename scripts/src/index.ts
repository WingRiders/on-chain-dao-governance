/* eslint-disable no-console */
import {sdk} from '@wingriders/governance-sdk'
import {program} from 'commander'

program.name('manage-proposal').description('Manage a governance proposal').version('0.1.0')

program.command('report-sdk').action((_) => console.log(sdk))

program.parse()
