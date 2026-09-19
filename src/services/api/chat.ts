import { api } from './client'

export interface ChatCitation {
  sourceType: string
  sourceId: string
  snippet: string
}

export interface ChatAnswer {
  answer: string
  citations: ChatCitation[]
}

function mapChatResponse(raw: Record<string, unknown>): ChatAnswer {
  return {
    answer: raw.answer as string,
    citations: ((raw.citations as unknown[]) || []).map((c) => {
      const cc = c as Record<string, unknown>
      return {
        sourceType: cc.source_type as string,
        sourceId: cc.source_id as string,
        snippet: cc.snippet as string,
      }
    }),
  }
}

export const chatApi = {
  ask: async (companyId: string, question: string): Promise<ChatAnswer> => {
    const raw = await api.post<Record<string, unknown>>(`/companies/${companyId}/chat`, { question })
    return mapChatResponse(raw)
  },
}
