import { useState } from "react";

export type DirectoryPerson = { name: string; email: string };

export type DirectoryDraft = {
  enabled: boolean;
  tabName: string;
  imageUrl: string;
  recipientEmail: string;
  people: DirectoryPerson[];
};

export const SAMPLE_DIRECTORY_PEOPLE: DirectoryPerson[] = [
  { name: "Ada Lovelace", email: "ada@partner.example" },
  { name: "Grace Hopper", email: "grace@partner.example" },
  { name: "Alan Turing", email: "alan@partner.example" },
];

export function emptyDirectoryDraft(
  overrides: Partial<DirectoryDraft> = {},
): DirectoryDraft {
  return {
    enabled: true,
    tabName: "Employees",
    imageUrl: "",
    recipientEmail: "",
    people: [...SAMPLE_DIRECTORY_PEOPLE],
    ...overrides,
  };
}

/** Build the mint `directory` object, or undefined when disabled / empty. */
export function directoryMintPayload(
  draft: DirectoryDraft,
): Record<string, unknown> | undefined {
  if (!draft.enabled) return undefined;
  const name = draft.tabName.trim();
  const recipientEmail = draft.recipientEmail.trim() || undefined;
  const imageUrl = draft.imageUrl.trim() || undefined;
  const people = draft.people.filter((p) => p.name.trim() && p.email.trim());
  if (!name && !recipientEmail && people.length === 0) return undefined;
  return {
    ...(name ? { name } : {}),
    ...(recipientEmail ? { recipientEmail } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(people.length > 0 ? { people } : {}),
  };
}

type Props = {
  value: DirectoryDraft;
  onChange: (next: DirectoryDraft) => void;
  /** Show recipientEmail field (Requests / Received scoping). */
  showRecipientEmail?: boolean;
};

/**
 * Shared app-context (`directory`) editor for Documents + Signature requests.
 * Session-only host people for Builder → Add from contacts.
 */
export function AppContextDirectoryFields({
  value,
  onChange,
  showRecipientEmail = false,
}: Props) {
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  function patch(partial: Partial<DirectoryDraft>) {
    onChange({ ...value, ...partial });
  }

  function addPerson() {
    const name = newName.trim();
    const email = newEmail.trim();
    if (!name || !email) return;
    patch({ people: [...value.people, { name, email }] });
    setNewName("");
    setNewEmail("");
  }

  function removePerson(email: string) {
    patch({ people: value.people.filter((p) => p.email !== email) });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-900">App context</p>
          <p className="text-xs text-zinc-500">
            Optional mint body field{" "}
            <code className="text-[11px]">directory</code> — people from your
            product for Builder → Add from contacts. Session-only; not ZSign
            Contacts.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="rounded border-zinc-300"
          />
          Include directory
        </label>
      </div>

      {value.enabled ? (
        <div className="space-y-3 border-t border-zinc-100 pt-3">
          {showRecipientEmail ? (
            <div className="space-y-1">
              <label
                htmlFor="dir-recipient-email"
                className="block text-xs font-medium text-zinc-600"
              >
                Recipient email{" "}
                <span className="text-zinc-400">(directory.recipientEmail)</span>
              </label>
              <p className="text-xs text-zinc-500">
                Empty uses the API key owner. Set an email to open Received (or
                guest-scoped hubs) as that person.
              </p>
              <input
                id="dir-recipient-email"
                type="email"
                value={value.recipientEmail}
                onChange={(e) => patch({ recipientEmail: e.target.value })}
                placeholder="owner default, or signer@example.com"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="dir-tab-name"
                className="block text-xs font-medium text-zinc-600"
              >
                Tab name <span className="text-zinc-400">(directory.name)</span>
              </label>
              <input
                id="dir-tab-name"
                type="text"
                value={value.tabName}
                onChange={(e) => patch({ tabName: e.target.value })}
                placeholder="Employees"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="dir-logo"
                className="block text-xs font-medium text-zinc-600"
              >
                Logo URL{" "}
                <span className="text-zinc-400">(optional, no SVG)</span>
              </label>
              <input
                id="dir-logo"
                type="url"
                value={value.imageUrl}
                onChange={(e) => patch({ imageUrl: e.target.value })}
                placeholder="https://…/logo.png"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-600">
              People <span className="text-zinc-400">(directory.people)</span>
            </p>
            <ul className="space-y-1">
              {value.people.map((p) => (
                <li
                  key={p.email}
                  className="flex items-center justify-between gap-2 rounded-md bg-zinc-50 px-3 py-2 text-sm ring-1 ring-zinc-200"
                >
                  <span>
                    {p.name} <span className="text-zinc-500">· {p.email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removePerson(p.email)}
                    className="text-xs text-zinc-600 underline hover:text-zinc-900"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {value.people.length === 0 ? (
                <li className="text-xs text-zinc-500">No people yet.</li>
              ) : null}
            </ul>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
                className="min-w-[8rem] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@partner.example"
                className="min-w-[12rem] flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <button
                type="button"
                onClick={addPerson}
                className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
