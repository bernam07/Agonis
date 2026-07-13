/*
 Copyright 2026 Bernardo Miguel Fernandes Martins

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

export interface Game {
  id: number;
  name: string;
  game_name?: string;
  cover?: {
    url: string;
  };
  first_release_date?: number;
  summary?: string;
  igdb_id?: number; 
  platforms?: any[];
  game_cover?: string;
}

export interface UserGame {
  id?: string;
  user_id?: string;
  igdb_id: number;
  status: string;
  rating: number;
  review?: string;
  created_at?: string;
  completed_at?: string;
}

export type CombinedGame = UserGame & Game;

export interface LibStats {
  total: number;
  completed: number;
  backlog: number;
  averageRating: number | string;
  favorites: CombinedGame[];
}