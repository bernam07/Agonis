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

import { supabase } from './supabase'

export async function startCheckout() {
  const { data, error } = await supabase.functions.invoke('create-checkout-session')
  if (error || !data?.url) {
    throw new Error(data?.error ?? 'Could not start checkout. Please try again.')
  }
  window.location.href = data.url
}

export async function openBillingPortal() {
  const { data, error } = await supabase.functions.invoke('create-portal-session')
  if (error || !data?.url) {
    throw new Error(data?.error ?? 'Could not open the billing portal. Please try again.')
  }
  window.location.href = data.url
}
