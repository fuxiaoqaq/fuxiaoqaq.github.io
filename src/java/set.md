---
title: Set
---

:::danger
源代码基于JDK17
:::

## HashSet
### 总结
:::warning
#### 特性
- HashSet 底层借助 `HashMap` 实现，我们可以观察它的多个构造方法，本质上都是new一个HashMap
- 使用 PRESENT 作为 HashMap的value值，使用HashSet的开发者只需**关注**于需要插入的`key`，**屏蔽**了 HashMap 的 `value`
  ```java
    private static final Object PRESENT = new Object();

    public boolean add(E e) {
         return this.map.put(e, PRESENT) == null;
    }
    public boolean remove(Object o) {
         return this.map.remove(o) == PRESENT;
    }
  ```
:::

## LinkedHashSet
### 总结
:::warning
#### 特性
- `LinkedHashSet`继承了`HashSet`，我们跟随到父类 HashSet 的构造方法看看
- 发现父类中map的实现采用`LinkedHashMap`，这里注意不是`HashMap`，而LinkedHashMap底层又采用HashMap + 双向链表实现的，所以本质上LinkedHashSet还是使用HashMap实现的
  ```java
  HashSet(int initialCapacity, float loadFactor, boolean dummy) {
    this.map = new LinkedHashMap(initialCapacity, loadFactor);
  }
  ```
:::

## TreeSet
### 总结
:::warning
#### 特性
- TreeSet 是基于 TreeMap 的实现，所以存储的元素是**有序**的
:::