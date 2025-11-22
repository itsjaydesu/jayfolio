"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "../contexts/LanguageContext";
import { formatDisplayDate } from "../lib/formatters";
import {
  getCategoryName,
  getLocalizedContent,
  getLocalizedTags,
  t,
} from "../lib/translations";
import { useAdminStatus } from "../lib/useAdminStatus";

export default function ProjectListItem({
  entry,
  type = "projects",
  tone = "neutral", // Kept for compatibility/styling hooks
  category = null,
  onClick = null,
  style = undefined,
}) {
  const { language } = useLanguage();
  const { isAdmin: clientAdmin } = useAdminStatus();

  if (!entry || !entry.slug) {
    console.error("[ProjectListItem] Invalid entry data:", entry);
    return null;
  }

  const href = `/${type}/${entry.slug}`;
  const editHref = `/administratorrrr?type=${type}&slug=${encodeURIComponent(
    entry.slug
  )}&panel=collapsed`;

  const localizedTitle =
    getLocalizedContent(entry.title, language) || entry.title;
  const localizedSummary =
    getLocalizedContent(entry.summary, language) || entry.summary;
  const formattedDate = entry.createdAt
    ? formatDisplayDate(entry.createdAt, language)
    : "";
  const displayDate =
    language === "en" ? formattedDate.toUpperCase() : formattedDate;
  const localizedTags = getLocalizedTags(entry.tags, language);
  
  const coverAlt = entry.coverImage
    ? getLocalizedContent(entry.coverImage.alt, language)
    : "";
  const hasCoverImage = Boolean(entry.coverImage?.url);
  
  const fallbackTitleText =
    typeof entry.title === "string"
      ? entry.title
      : typeof entry.title?.en === "string"
      ? entry.title.en
      : entry.slug;
  const displayTitle =
    typeof localizedTitle === "string" && localizedTitle.trim().length > 0
      ? localizedTitle.trim()
      : fallbackTitleText;

  const handleCardClick = () => {
    if (onClick) onClick();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `${type}ScrollPosition`,
        window.scrollY.toString()
      );
    }
  };

  return (
    <Link
      href={href}
      className="project-list-item"
      data-tone={tone}
      data-entry-slug={entry.slug}
      onClick={handleCardClick}
      style={style}
      aria-label={t("post.view", language, { title: localizedTitle })}
    >
      <div className="project-list-item__visual">
        {hasCoverImage ? (
          <Image
            src={entry.coverImage.url}
            alt={coverAlt || `${localizedTitle} cover image`}
            fill
            sizes="(max-width: 640px) 80px, 120px"
            className="project-list-item__image"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        ) : (
          <div className="project-list-item__placeholder" />
        )}
      </div>

      <div className="project-list-item__content">
        <div className="project-list-item__header">
          <h2 className="project-list-item__title" title={displayTitle}>
            {localizedTitle}
          </h2>
          <div className="project-list-item__meta">
            {entry.createdAt && (
              <time className="project-list-item__date" dateTime={entry.createdAt}>
                {displayDate}
              </time>
            )}
            {category && (
              <span className="project-list-item__category">
                {getCategoryName(category, language)}
              </span>
            )}
          </div>
        </div>

        {localizedSummary && (
          <p className="project-list-item__summary">{localizedSummary}</p>
        )}

        {localizedTags.length > 0 && (
          <ul className="project-list-item__tags">
            {localizedTags.slice(0, 4).map((tag, index) => (
              <li key={`${entry.slug}-tag-${index}`}>{tag}</li>
            ))}
          </ul>
        )}
      </div>

      {clientAdmin && (
        <object className="project-list-item__admin">
          <Link
            href={editHref}
            className="project-list-item__edit-btn"
            aria-label={`${t("admin.edit", language)} ${localizedTitle}`}
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
        </object>
      )}
    </Link>
  );
}
