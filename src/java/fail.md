---
title: Fail-fast
---

## 什么是fail-fast机制?
Fail-fast是快速失败机制，是java集合（Collection）中的一种错误检测机制，主要用于当迭代集合的过程中，该集合在结构上发生改变的时候，就有可能发生fail-fast机制，即抛出ConcurrentModificationException异常。Fail-fast机制并不能保证在不同步的修改下一定会抛出异常，它只是尽最大的努力抛出，所以这种机制一般只是用于检测bug。

## fail-fast出现的场景
在我们常见的java集合中都有可能出现fail-fast机制，例如ArrayList，HashMap等线程不安全的集合，还有在多线程或单线程环境下都有可能出现fail-fast机制。

总的来说，可能会出现fail-fast机制的前提是一般在集合拿到迭代器迭代的过程中，而该集合元素又发生了变化，如迭代过程中集合的元素被删除修改或新增元素等，都会触发fail-fast机制，程序会尽可能快速抛出ConcurrentModificationException异常。

:::warning 如何避免fail-fast机制?
- 如果非要在遍历的时候修改集合，那么建议用迭代器的remove等方法，而不是用集合的remove等方法。
- 如果是并发的环境，那还要对Iterator对象加锁；也可以直接使用Collections.synchronizedList
- CopyOnWriteArrayList（采用fail-safe）等
:::

## 什么是fail-safe机制?
在 Java 中，fail-safe通常用于描述一种迭代器的行为。具体来说，当使用迭代器遍历一个集合（如 ArrayList、HashMap 等）时，如果在迭代过程中对集合进行了修改（如添加、删除元素），传统的迭代器可能会抛出 ConcurrentModificationException 异常，而 "fail-safe" 迭代器会继续进行遍历而不抛出异常。

fail-safe迭代器实现的方式是通过对原始集合进行拷贝或使用额外的数据结构来避免修改操作对迭代过程的影响。这样，即使集合在迭代过程中被修改，迭代器仍然能够正常完成遍历。例如 CopyOnWriteArrayList


## Collections.synchronizedXXX() <Badge text="已不推荐使用" type="warning"/>
### Collections.synchronizedList 源码分析
```java
/**
 * 1.方法基本上都加了synchronized 内置锁
 * 2.迭代方法没有加锁,迭代遍历的时候对当前集合对象进行加锁
 *   List<String> list = Collections.synchronizedList(new ArrayList<String>());
 *   //必须使用集合对象进行锁定
 *   synchronized (list) {
 *     //进行遍历逻辑
 *   } 
 */
static class SynchronizedList<E>
        extends SynchronizedCollection<E>
        implements List<E> {
        private static final long serialVersionUID = -7754090372962971524L;

        final List<E> list;

        SynchronizedList(List<E> list) {
            super(list);
            this.list = list;
        }
        SynchronizedList(List<E> list, Object mutex) {
            super(list, mutex);
            this.list = list;
        }

        public boolean equals(Object o) {
            if (this == o)
                return true;
            synchronized (mutex) {return list.equals(o);}
        }
        public int hashCode() {
            synchronized (mutex) {return list.hashCode();}
        }

        public E get(int index) {
            synchronized (mutex) {return list.get(index);}
        }
        public E set(int index, E element) {
            synchronized (mutex) {return list.set(index, element);}
        }
        public void add(int index, E element) {
            synchronized (mutex) {list.add(index, element);}
        }
        public E remove(int index) {
            synchronized (mutex) {return list.remove(index);}
        }

        public int indexOf(Object o) {
            synchronized (mutex) {return list.indexOf(o);}
        }
        public int lastIndexOf(Object o) {
            synchronized (mutex) {return list.lastIndexOf(o);}
        }

        public boolean addAll(int index, Collection<? extends E> c) {
            synchronized (mutex) {return list.addAll(index, c);}
        }

        public ListIterator<E> listIterator() {
            return list.listIterator(); // Must be manually synched by user
        }

        public ListIterator<E> listIterator(int index) {
            return list.listIterator(index); // Must be manually synched by user
        }

        public List<E> subList(int fromIndex, int toIndex) {
            synchronized (mutex) {
                return new SynchronizedList<>(list.subList(fromIndex, toIndex),
                                            mutex);
            }
        }
}
```

