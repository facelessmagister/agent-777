---
trigger: manual
---

Identifier for this function. Used to group telemetry data by function.
metadata?:
Record<string, string | number | boolean | Array<null | undefined | string> | Array<null | undefined | number> | Array<null | undefined | boolean>>
Additional information to include in the telemetry data.
providerOptions?:
Record<string,Record<string,JSONValue>> | undefined
Provider-specific options. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.
activeTools?:
Array<TOOLNAME>
Limits the tools that are available for the model to call without changing the tool call and result types in the result. All tools are active by default.
stopWhen?:
StopCondition<TOOLS> | Array<StopCondition<TOOLS>>
Condition for stopping the generation when there are tool results in the last step. When the condition is an array, any of the conditions can be met to stop the generation. Default: stepCountIs(1).
prepareStep?:
(options: PrepareStepOptions) => PrepareStepResult<TOOLS> | Promise<PrepareStepResult<TOOLS>>
Optional function that you can use to provide different settings for a step. You can modify the model, tool choices, active tools, system prompt, and input messages for each step.
PrepareStepFunction<TOOLS>
options:
object
The options for the step.
PrepareStepOptions
steps:
Array<StepResult<TOOLS>>
The steps that have been executed so far.
stepNumber:
number
The number of the step that is being executed.
model:
LanguageModel
The model that is being used.
messages:
Array<ModelMessage>
The messages that will be sent to the model for the current step.
PrepareStepResult<TOOLS>
model?:
LanguageModel
Change the model for this step.
toolChoice?:
ToolChoice<TOOLS>
Change the tool choice strategy for this step.
activeTools?:
Array<keyof TOOLS>
Change which tools are active for this step.
system?:
string
Change the system prompt for this step.
messages?:
Array<ModelMessage>
Modify the input messages for this step.
experimental_context?:
unknown
Context that is passed into tool execution. Experimental (can break in patch releases).
experimental_download?:
(requestedDownloads: Array<{ url: URL; isUrlSupportedByModel: boolean }>) => Promise<Array<null | { data: Uint8Array; mediaType?: string }>>
Custom download function to control how URLs are fetched when they appear in prompts. By default, files are downloaded if the model does not support the URL for the given media type. Experimental feature. Return null to pass the URL directly to the model (when supported), or return downloaded content with data and media type.
experimental_repairToolCall?:
(options: ToolCallRepairOptions) => Promise<LanguageModelV2ToolCall | null>
A function that attempts to repair a tool call that failed to parse. Return either a repaired tool call or null if the tool call cannot be repaired.
ToolCallRepairOptions
system:
string | undefined
The system prompt.
messages:
ModelMessage[]
The messages in the current generation step.
toolCall:
LanguageModelV2ToolCall
The tool call that failed to parse.
tools:
TOOLS
The tools that are available.
parameterSchema:
(options: { toolName: string }) => JSONSchema7
A function that returns the JSON Schema for a tool.
error:
NoSuchToolError | InvalidToolInputError
The error that occurred while parsing the tool call.
experimental_output?:
Output
Experimental setting for generating structured outputs.
Output
Output.text():
Output
Forward text output.
Output.object():
Output
Generate a JSON object of type OBJECT.
Options
schema:
Schema<OBJECT>
The schema of the JSON object to generate.
onStepFinish?:
(result: OnStepFinishResult) => Promise<void> | void
Callback that is called when a step is finished.
OnStepFinishResult
finishReason:
"stop" | "length" | "content-filter" | "tool-calls" | "error" | "other" | "unknown"
The reason the model finished generating the text for the step.
usage:
LanguageModelUsage
The token usage of the step.
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
text:
string
The full text that has been generated.
toolCalls:
ToolCall[]
The tool calls that have been executed.
toolResults:
ToolResult[]
The tool results that have been generated.
warnings:
Warning[] | undefined
Warnings from the model provider (e.g. unsupported settings).
response?:
Response
Response metadata.
Response
id:
string
The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.
modelId:
string
The model that was used to generate the response. The AI SDK uses the response model from the provider response when available, and the model from the function call otherwise.
timestamp:
Date
The timestamp of the response. The AI SDK uses the response timestamp from the provider response when available, and creates a timestamp otherwise.
headers?:
Record<string, string>
Optional response headers.
body?:
unknown
Optional response body.
isContinued:
boolean
True when there will be a continuation step with a continuation text.
providerMetadata?:
Record<string,Record<string,JSONValue>> | undefined
Optional metadata from the provider. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.