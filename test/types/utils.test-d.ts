import * as utils from '../../utils'
import { expectNotType } from 'tsd'

expectNotType<undefined>(utils.RequestKeys)
expectNotType<undefined>(utils.TransactionSource)
expectNotType<undefined>(utils.tryToExtractBody)
expectNotType<undefined>(utils.extractRequestData)
expectNotType<undefined>(utils.extractUserData)
expectNotType<undefined>(utils.getTransactionName)
expectNotType<undefined>(utils.extractPathForTransaction)
expectNotType<undefined>(utils.shouldHandleError)
expectNotType<undefined>(utils.errorResponse)
