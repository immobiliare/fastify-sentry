// exports.validateOptions = function (opts) {
//     if (opts.parseRequestOptions) {
//         for (const key of Object.keys(DEFAULT_EVENT_DATA).filter(
//             (key) => key === 'request' || key === 'transaction'
//         )) {
//             if (!key in opts.parseRequestOptions) continue;
//             else if (typeof opts.parseRequestOptions[key] !== 'boolean')
//                 throw new Error(`parseRequestOptions.${key} must be a boolean`);
//         }
//     }
//     if (typeof opts.shouldHandleError !== 'function') {
//         throw new Error('shouldHandleError must be a function');
//     }
//     if (typeof opts.setErrorHandler !== 'function') {
//         throw new Error('setErrorHandler must be a function');
//     }
// };
