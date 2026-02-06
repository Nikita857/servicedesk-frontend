"use client";

import {
  TreeView,
  createTreeCollection,
  Box,
  Badge,
} from "@chakra-ui/react";
import { LuFolder } from "react-icons/lu";
import type {
  WikiCategoryWithArticles,
  WikiArticleListItem,
} from "@/lib/api/wiki";
import { TreeViewListBoxItem } from "./TreeViewListBoxItem";

interface CategoryData {
  articles: WikiArticleListItem[];
}

interface WikiTreeNode {
  id: string;
  name: string;
  type: "category" | "article";
  data?: CategoryData;
  children?: WikiTreeNode[];
}

interface WikiTreeViewProps {
  categories: WikiCategoryWithArticles[];
  onLike?: (e: React.MouseEvent, articleId: number) => void;
  likingArticleId?: number | null;
}

export const WikiTreeView = ({
  categories,
  onLike,
  likingArticleId,
}: WikiTreeViewProps) => {
  console.log("WikiTreeView categories:", categories);

  // Transform categories to tree structure with articles data
  const rootNode: WikiTreeNode = {
    id: "ROOT",
    name: "ROOT",
    type: "category",
    children: categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: "category" as const,
      data: {
        articles: category.children,
      },
      // Add a dummy child so TreeView treats this as a branch
      children: [
        {
          id: `${category.id}-placeholder`,
          name: "placeholder",
          type: "article" as const,
        },
      ],
    })),
  };

  console.log("WikiTreeView rootNode:", rootNode);

  const collection = createTreeCollection<WikiTreeNode>({
    nodeToValue: (node) => node.id,
    nodeToString: (node) => node.name,
    rootNode,
  });

  return (
    <TreeView.Root
      collection={collection}
      defaultExpandedValue={[]}
      size="md"
      variant="subtle"
    >
      <TreeView.Tree>
        <TreeView.Node<WikiTreeNode>
          render={({ node, nodeState }) => {
            // Skip ROOT node
            if (node.id === "ROOT") {
              return null;
            }

            // Skip placeholder nodes
            if (node.name === "placeholder") {
              return null;
            }

            // Category (Branch)
            if (node.type === "category") {
              const categoryData = node.data;
              const articleCount = categoryData?.articles?.length || 0;

              console.log("Rendering category:", node.name, "isBranch:", nodeState.isBranch, "expanded:", nodeState.expanded, "articles:", articleCount);

              return (
                <>
                  <TreeView.BranchControl>
                    <LuFolder />
                    <TreeView.BranchText fontWeight="medium">
                      {node.name}
                    </TreeView.BranchText>
                    <Badge colorPalette="blue" variant="subtle" size="sm" ml={2}>
                      {articleCount}{" "}
                      {articleCount === 1
                        ? "статья"
                        : articleCount < 5
                          ? "статьи"
                          : "статей"}
                    </Badge>
                  </TreeView.BranchControl>

                  {/* Articles as Listbox when category is expanded */}
                  <TreeView.BranchContent>
                    {categoryData?.articles && categoryData.articles.length > 0 ? (
                      <Box pl={4} pt={2} pb={2}>
                        <TreeViewListBoxItem
                          articles={categoryData.articles}
                          onLike={onLike}
                          likingArticleId={likingArticleId}
                        />
                      </Box>
                    ) : (
                      <Box pl={4} pt={2} pb={2} color="fg.muted" fontSize="sm">
                        Нет статей в категории
                      </Box>
                    )}
                  </TreeView.BranchContent>
                </>
              );
            }

            console.log("Unknown node type:", node);
            return null;
          }}
        />
      </TreeView.Tree>
    </TreeView.Root>
  );
};
