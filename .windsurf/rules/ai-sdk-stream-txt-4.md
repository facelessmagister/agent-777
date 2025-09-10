---
trigger: model_decision
description: how to use streamText() which Streams text generations from a language model
---

onAbort?:
(event: OnAbortResult) => Promise<void> | void
Callback that is called when a stream is aborted via AbortSignal. You can use it to perform cleanup operations.
OnAbortResult
steps:
Array<StepResult>
Details for all previously finished steps.
Returns
content:
Promise<Array<ContentPart<TOOLS>>>
The content that was generated in the last step. Automatically consumes the stream.
finishReason:
Promise<'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'>
The reason why the generation finished. Automatically consumes the stream.
usage:
Promise<LanguageModelUsage>
The token usage of the last step. Automatically consumes the stream.
LanguageModelUsage
inputTokens:
number | undefined
The number of input (prompt) tokens used.
outputTokens:
number | undefined
The number of output (completion) tokens used.
totalTokens:
number | undefined
The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.
reasoningTokens?:
number | undefined
The number of reasoning tokens used.
cachedInputTokens?:
number | undefined
The number of cached input tokens.
totalUsage:
Promise<LanguageModelUsage>
The total token usage of the generated response. When there are multiple steps, the usage is the sum of all step usages. Automatically consumes the stream.
LanguageModelUsage
inputTokens:
number | undefined
The number of input (prompt) tokens used.
outputTokens:
number | undefined
The number of output (completion) tokens used.
totalTokens:
number | undefined
The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.
reasoningTokens?:
number | undefined
The number of reasoning tokens used.
cachedInputTokens?:
number | undefined
The number of cached input tokens.
providerMetadata:
Promise<ProviderMetadata | undefined>
Additional provider-specific metadata from the last step. Metadata is passed through from the provider to the AI SDK and enables provider-specific results that can be fully encapsulated in the provider.
text:
Promise<string>
The full text that has been generated. Automatically consumes the stream.
reasoning:
Promise<Array<ReasoningPart>>
The full reasoning that the model has generated in the last step. Automatically consumes the stream.
ReasoningPart
type:
'reasoning'
The type of the reasoning part.
text:
string
The reasoning text.
reasoningText:
Promise<string | undefined>
The reasoning text that the model has generated in the last step. Can be undefined if the model has only generated text. Automatically consumes the stream.
sources:
Promise<Array<Source>>
Sources that have been used as input to generate the response. For multi-step generation, the sources are accumulated from all steps. Automatically consumes the stream.
Source
sourceType:
'url'
A URL source. This is return by web search RAG models.
id:
string
The ID of the source.
url:
string
The URL of the source.
title?:
string
The title of the source.
providerMetadata?:
SharedV2ProviderMetadata
Additional provider metadata for the source.
files:
Promise<Array<GeneratedFile>>
Files that were generated in the final step. Automatically consumes the stream.
GeneratedFile
base64:
string
File as a base64 encoded string.
uint8Array:
Uint8Array
File as a Uint8Array.
mediaType:
string
The IANA media type of the file.
toolCalls:
Promise<TypedToolCall<TOOLS>[]>
The tool calls that have been executed. Automatically consumes the stream.
toolResults:
Promise<TypedToolResult<TOOLS>[]>
The tool results that have been generated. Resolved when the all tool executions are finished.
request:
Promise<LanguageModelRequestMetadata>
Additional request information from the last step.
LanguageModelRequestMetadata
body:
string
Raw request HTTP body that was sent to the provider API as a string (JSON should be stringified).
response:
Promise<LanguageModelResponseMetadata & { messages: Array<ResponseMessage>; }>
Additional response information from the last step.
LanguageModelResponseMetadata
id:
string
The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.
model:
string
The model that was used to generate the response. The AI SDK uses the response model from the provider response when available, and the model from the function call otherwise.
timestamp:
Date
The timestamp of the response. The AI SDK uses the response timestamp from the provider response when available, and creates a timestamp otherwise.
headers?:
Record<string, string>
Optional response headers.
messages:
Array<ResponseMessage>
The response messages that were generated during the call. It consists of an assistant message, potentially containing tool calls. When there are tool results, there is an additional tool message with the tool results that are available. If there are tools that do not have execute functions, they are not included in the tool results and need to be added separately.
warnings:
Promise<CallWarning[] | undefined>
Warnings from the model provider (e.g. unsupported settings) for the first step.
steps:
Promise<Array<StepResult>>
Response information for every step. You can use this to get information about intermediate steps, such as the tool calls or the response headers.
StepResult
stepType:
"initial" | "continue" | "tool-result"
The type of step. The first step is always an "initial" step, and subsequent steps are either "continue" steps or "tool-result" steps.
text:
string
The generated text by the model.
reasoning:
string | undefined
The reasoning text of the model (only available for some models).
sources:
Array<Source>
Sources that have been used as input.
Source
sourceType:
'url'
A URL source. This is return by web search RAG models.
id:
string
The ID of the source.
url:
string
The URL of the source.
title?:
string
The title of the source.
providerMetadata?:
SharedV2ProviderMetadata
Additional provider metadata for the source.
files:
Array<GeneratedFile>
Files that were generated in this step.
GeneratedFile
base64:
string
File as a base64 encoded string.
uint8Array:
Uint8Array
File as a Uint8Array.
mediaType:
string
The IANA media type of the file.
toolCalls:
array
A list of tool calls made by the model.
toolResults:
array
A list of tool results returned as responses to earlier tool calls.
finishReason:
'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'
The reason the model finished generating the text.
usage:
LanguageModelUsage
The token usage of the generated text.
LanguageModelUsage
inputTokens:
number | undefined
The number of input (prompt) tokens used.
outputTokens:
number | undefined
The number of output (completion) tokens used.
totalTokens:
number | undefined
The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.
reasoningTokens?:
number | undefined
The number of reasoning tokens used.
cachedInputTokens?:
number | undefined
The number of cached input tokens.
request?:
RequestMetadata
Request metadata.
RequestMetadata
body:
string
Raw request HTTP body that was sent to the provider API as a string (JSON should be stringified).
response?:
ResponseMetadata
Response metadata.
ResponseMetadata
id:
string
The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.
model:
string
The model that was used to generate the response. The AI SDK uses the response model from the provider response when available, and the model from the function call otherwise.
timestamp:
Date
The timestamp of the response. The AI SDK uses the response timestamp from the provider response when available, and creates a timestamp otherwise.
headers?:
Record<string, string>
Optional response headers.
messages:
Array<ResponseMessage>
The response messages that were generated during the call. It consists of an assistant message, potentially containing tool calls. When there are tool results, there is an additional tool message with the tool results that are available. If there are tools that do not have execute functions, they are not included in the tool results and need to be added separately.
warnings:
Warning[] | undefined
Warnings from the model provider (e.g. unsupported settings).
isContinued:
boolean
True when there will be a continuation step with a continuation text.
providerMetadata?:
Record<string,Record<string,JSONValue>> | undefined
Optional metadata from the provider. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.