package session

import (
	"encoding/json"
	"fmt"
)

// GetUsersInfo возвращает информацию о пользователях через Lua скрипт
func (m *Manager) GetUsersInfo() (map[string]interface{}, error) {
	// Lua скрипт для получения всех сессий и преобразования в информацию о пользователях
	luaScript := `
		local sessions = {}
		local keys = redis.call('KEYS', 'session:*')
		
		for i, key in ipairs(keys) do
			local sessionData = redis.call('GET', key)
			if sessionData then
				local session = cjson.decode(sessionData)
				local userInfo = {
					session_id = key,
					client_id = session.client_id,
					username = session.username,
					is_moderator = session.is_moderator
				}
				sessions[i] = userInfo
			end
		end
		
		return cjson.encode(sessions)
	`

	// Выполняем Lua скрипт
	result, err := m.client.Eval(m.ctx, luaScript, []string{}).Result()
	if err != nil {
		return nil, fmt.Errorf("Lua script execution failed: %v", err)
	}

	// Парсим результат
	var sessions []map[string]interface{}
	if resultStr, ok := result.(string); ok {
		if err := json.Unmarshal([]byte(resultStr), &sessions); err != nil {
			return nil, fmt.Errorf("failed to parse Lua script result: %v", err)
		}
	}

	// Формируем ответ
	response := map[string]interface{}{
		"total_sessions": len(sessions),
		"users":          sessions,
	}

	return response, nil
}

// GetSessionStats возвращает статистику по сессиям через Lua
func (m *Manager) GetSessionStats() (map[string]interface{}, error) {
	luaScript := `
		local keys = redis.call('KEYS', 'session:*')
		local total = #keys
		local moderators = 0
		local regular_users = 0
		
		for i, key in ipairs(keys) do
			local sessionData = redis.call('GET', key)
			if sessionData then
				local session = cjson.decode(sessionData)
				if session.is_moderator then
					moderators = moderators + 1
				else
					regular_users = regular_users + 1
				end
			end
		end
		
		local result = {
			total_sessions = total,
			moderators = moderators,
			regular_users = regular_users
		}
		
		return cjson.encode(result)
	`

	result, err := m.client.Eval(m.ctx, luaScript, []string{}).Result()
	if err != nil {
		return nil, fmt.Errorf("Lua script execution failed: %v", err)
	}

	var stats map[string]interface{}
	if resultStr, ok := result.(string); ok {
		if err := json.Unmarshal([]byte(resultStr), &stats); err != nil {
			return nil, fmt.Errorf("failed to parse Lua script result: %v", err)
		}
	}

	return stats, nil
}
