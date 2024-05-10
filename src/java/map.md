---
title: Map
---

:::danger
源代码基于JDK17
:::

## HashMap
### 源码分析

```java

public class HashMap<K,V> extends AbstractMap<K,V>
        implements Map<K,V>, Cloneable, Serializable {
    // 默认的数组初始化容量为16，这个容量只能以2的指数倍进行扩容操作
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16  
    // 数组最大容量  
    static final int MAXIMUM_CAPACITY = 1 << 30;
    // 默认的负载因子值为0.75  
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    // 桶的树化阈值，如果一个桶(单向链表)中的节点数量大于该值，则需要将该桶转换成红黑树 
    // 该值至少为8  
    // 是否需要进行树化，需要依据MIN_TREEIFY_CAPACITY常量的值进行判定  
    static final int TREEIFY_THRESHOLD = 8;
    // 桶的反树化阈值，如果一个桶中的红黑树节点数量小于该值，则需要将该桶从红黑树重新转换为链表  
    static final int UNTREEIFY_THRESHOLD = 6;
    // 当集合中的K-V键值对节点过多时，是进行树化操作还是进行扩容操作呢?  
    // 针对这个问题，HashMap 集合使用 MIN_TREEIFY_CAPACITY 常量进行控制  
    // 只有当集合中K-V键值对节点数大于该值，  
    // 并且某个桶中的K-V键值对节点数大于TREEIFY_THRESHOLD的值时，该桶才会进行树化操作  
    static final int MIN_TREEIFY_CAPACITY = 64;

    // 使用该变量记录HashMap集合的数组结构  
    // 数组可以扩容，甚至在进行某些操作时允许数组的长度为0
    transient Node<K,V>[] table;

    // 该Set集合存储了当前集合中所有K-V键值对节点的引用  
    // 可以将该Set集合理解为缓存方案，它不在意每个K-V键值对节点的真实存储位置，  
    // 还可以有效减少HashMap集合的编码工作量  
    transient Set<Map.Entry<K,V>> entrySet;

    // 记录当前K-V键值对节点的数量  
    transient int size;

    // 记录该集合在初始化后进行写操作的次数  
    transient int modCount;

    // table 数组下一次进行扩容操作的门槛，这个门槛值=当前集合容量值 * loadFactor  
    int threshold;

    // 设置的负载因子，默认为DEFAULT_LOAD_FACTOR，可以设置该值大于1  
    final float loadFactor;

    //HashMap 集合使用 HashMap.Node 类的对象构建单向链表
    static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;
        final K key;
        V value;
        Node<K,V> next;

        Node(int hash, K key, V value, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }

        public final K getKey()        { return key; }
        public final V getValue()      { return value; }
        public final String toString() { return key + "=" + value; }

        public final int hashCode() {
            return Objects.hashCode(key) ^ Objects.hashCode(value);
        }

        public final V setValue(V newValue) {
            V oldValue = value;
            value = newValue;
            return oldValue;
        }

        public final boolean equals(Object o) {
            if (o == this)
                return true;

            return o instanceof Map.Entry<?, ?> e
                    && Objects.equals(key, e.getKey())
                    && Objects.equals(value, e.getValue());
        }
    }
}
```
### 为什么严格要求数组大小为2的幂数
:::tip
- 要求容量必须是2的幂次方的原因是为了提高散列（Hash）算法的效率和避免哈希冲突。
- HashMap使用了一种散列算法来将键（Key）映射到存储桶（Bucket）的索引位置。这个索引位置是通过对键的哈希码进行一系列计算得出的。当容量是2的幂次方时，可以使用位运算来代替较慢的取余运算，从而提高计算速度。
- 使用位与运算&可以快速计算出索引位置，因为容量是2的幂次方，其二进制形式的最后几位都是1，而位与运算可以保留哈希码中与容量对应位的值，将其他位的值置为0。
- 容量为2的幂次方还能够更均匀地分布哈希码，减少哈希冲突的概率。如果容量不是2的幂次方，那么使用位与运算时会导致某些索引位置无法访问到，从而导致哈希表中的存储桶没有充分利用。这可能会导致某些桶中的元素数量过多，增加查找和插入操作的时间复杂度。
- 为了保证散列算法的高效性和减少哈希冲突，HashMap严格要求容量必须是2的幂次方，并且在扩容时会将容量扩展为大于当前容量的最小2的幂次方。
:::
### 初始化以及扩容总结
:::warning
#### 初始化
- 默认构造器初始化，默认的负载因子值为0.75，默认大小为16。
- 指定默认大小的构造器进行初始化，会以指定的默认大小最近接近2的幂数的数值进行初始化，例如指定30 初始化为 32。
#### 数据结构
- HashMap 是以数组 + （链表或红黑树）结构存储的。
#### 链表转红黑树逻辑
#### 红黑树退化为链表逻辑
#### 扩容规则
- 默认的负载因子值为0.75，默认大小为16
- 计算出扩容门槛值为 0.75 * 16 为12 ，当存储的大小等于12的时候 触发扩容机制
- 扩容到 16 * 2 = 32 并且计算出下次触发扩容的门槛值 0.75 * 32 = 24 当存储的大小等于24的时候 会触发下一次扩容
:::
## LinkedHashMap
### 源码分析
```java

public class LinkedHashMap<K,V>
        extends HashMap<K,V>
        implements Map<K,V>
{
    static class Entry<K,V> extends HashMap.Node<K,V> {
        java.util.LinkedHashMap.Entry<K,V> before, after;
        Entry(int hash, K key, V value, Node<K,V> next) {
            super(hash, key, value, next);
        }
    }

    transient LinkedHashMap.Entry<K,V> head;

    transient LinkedHashMap.Entry<K,V> tail;

    final boolean accessOrder;
}
```
### 总结
:::warning
#### 特性
- LinkedHashMap 可以看作是 `HashMap` 和 `LinkedList` 的结合：它在 HashMap 的基础上添加了一条双向链表，`默认`存储各个元素的插入顺序，但由于这条双向链表，使得 LinkedHashMap 可以实现 `LRU`缓存淘汰策略，因为我们可以设置这条双向链表按照`元素的访问次序`进行排序
- LinkedHashMap 是 HashMap 的子类，所以它具备 HashMap 的所有特点，其次，它在 HashMap 的基础上维护了一条`双向链表`，该链表存储了**所有元素**，`默认`元素的顺序与插入顺序**一致**。若`accessOrder`属性为`true`，则遍历顺序按元素的访问次序进行排序
#### 实现LRU
#### 1.该方法可以移除`最靠近链表头部`的一个节点，而在`get()`方法中可以看到下面这段代码，其作用是挪动结点的位置
```java
protected boolean removeEldestEntry(java.util.Map.Entry<K, V> eldest) {
    return false;
}
```
#### 2.只要调用了`get()`且`accessOrder = true`，则会将该节点更新到链表`尾部`，具体的逻辑在`afterNodeAccess()`中
```java
if (this.accessOrder) {
    this.afterNodeAccess(e);
}
```
#### 3.具体实现
- 指定`accessOrder = true`可以设定链表按照访问顺序排列，通过提供的构造器可以设定`accessOrder`
```java
public LinkedHashMap(int initialCapacity, float loadFactor, boolean accessOrder) {
    super(initialCapacity, loadFactor);
    this.accessOrder = accessOrder;
}
```
- 重写`removeEldestEntry()`方法，内部定义逻辑，通常是判断`容量`是否达到上限，若是则执行淘汰。
#### 自定义实现LRU
```java
class LRUCache {  
    LinkedHashMap<Integer, Integer> map;   
    int capacity;  
    // 使用开启了accessOrder的linkedHashMap，表示其具备访问有序性。 
    public LRUCache(int capacity) { 
        this.capacity = capacity;       
        map = new LinkedHashMap<>(capacity, 0.75f, true);    
    }  
    public int get(int key) { 
        if (map.containsKey(key))      
              return map.get(key);
        return -1;    
    }  
    public void put(int key, int value) {   
         // 先判断是否有这个key  
        if (map.containsKey(key)) {   
                 map.put(key, value);            
                 return;        
                 }
        // 移除第一个元素                  
        if (map.size() == this.capacity) {            
            for (int firstKey : map.keySet()) {               
                 map.remove(firstKey);               
                 break;           
            }        
        }        
        map.put(key, value);   
   }
}  
```
:::
## TreeMap
### 总结
:::warning
#### 特性
- 基于红黑树,底层是由`红黑树`这种数据结构实现的，所以操作的时间复杂度恒为`O(logN)`,线程不安全
- 默认情况下按照`key`自然排序，另一种是可以通过传入定制的`Comparator`进行自定义规则排序
- TreeMap 可以对`key`进行自然排序或者自定义排序，自定义排序时需要传入`Comparator`，而自然排序要求`key`实现了`Comparable`接口
    ```java
    // 按照 key 自然排序，Integer 的自然排序是升序
    TreeMap<Integer, Object> naturalSort = new TreeMap<>();
    // 定制排序，按照 key 降序排序
    TreeMap<Integer, Object> customSort = new TreeMap<>((o1, o2) -> Integer.compare(o2, o1));
    ```
:::

## HashTable
### 总结
:::warning
#### 特性
- 使用数组+链表,线程安全
- HashTable 默认长度为11，负载因子为0.75，即元素个数达到数组长度的 75% 时，会进行一次扩容，每次扩容为原来数组长度的2倍
:::

## WeakHashMap
### 总结
:::warning
#### 特性
- 使用数组+链表,它依赖普通的`Map`进行实现，是一个非线程安全的集合
- WeakHashMap 日常开发中比较少见，它是基于普通的`Map`实现的，而里面`Entry`中的键在每一次的`垃圾回收`都会被清除掉，所以非常适合用于`短暂访问`、`仅访问一次的元素`，缓存在`WeakHashMap`中，并尽早地把它回收掉
- 默认长度16 2的幂数，负载因子为0.75，即元素个数达到数组长度的 75% 时，会进行一次扩容，每次扩容为原来数组长度的2倍
- 它的键是一种**弱键**，放入 WeakHashMap 时，随时会被回收掉，所以不能确保某次访问元素一定存在
- WeakHashMap 通常作为**缓存**使用，适合存储那些**只需访问一次**、或**只需保存短暂时间**的键值对
:::